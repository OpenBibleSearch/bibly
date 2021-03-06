// adapted from old scripturizer.js code

var bibly = (window.bibly) ? window.bibly : {};
bibly.version = '0.2';
bibly.max_nodes =  500;
bibly.className = 'bibly_reference';

(function() {

	// book names list	
    var vol = 'I+|1st|2nd|3rd|First|Second|Third|1|2|3',
		bok = 'Genesis|Gen|Exodus|Exod?|Leviticus|Lev|Levit?|Numbers|'+
			'Nmb|Numb?|Deuteronomy|Deut?|Joshua|Josh?|Judges|Jdg|Judg?|Ruth|Ru|'+
			'Samuel|Sam|Sml|Kings|Kngs?|Kin?|Chronicles|Chr|Chron|Ezra|Ez|'+
			'Nehemiah|Nehem?|Esther|Esth?|Job|Jb|Psalms?|Ps[as]?|Proverbs?|Prov?|'+
			'Ecclesiastes|Eccl?|Songs?ofSolomon|Song?|Songs|Isaiah|Isa|Jeremiah|'+
			'Jer|Jerem|Lamentations|Lam|Lament?|Ezekiel|Ezek?|Daniel|Dan|Hosea|'+
			'Hos|Joel|Jo|Amos|Am|Obadiah|Obad?|Jonah|Jon|Micah|Mic|Nahum|Nah|'+
			'Habakkuk|Hab|Habak|Zephaniah|Zeph|Haggai|Hag|Hagg|Zechariah|Zech?|'+
			'Malachi|Malac?|Mal|Mat{1,2}hew|Mat{1,2}?|Mark|Mrk|Luke|Lu?k|John|Jhn|Jo|'+
			'Acts?|Ac|Romans|Rom|Corinthians|Cor|Corin|Galatians|Gal|Galat|'+
			'Ephesians|Eph|Ephes|Philippians|Phili?|Colossians|Col|Colos|'+
			'Thessalonians|Thes{1,2}?|Timothy|Tim|Titus|Tts|Tit|Philemon|Phil?|'+
			'Hebrews|Hebr?|James|Jam|Jms|Peter|Pete?|Jude|Ju|Revelations?|Rev|'+
			'Revel',
		ver =  '\\d+(:\\d+)?(?:\\s?[-–&]\\s?\\d+)?',  // 1 OR 1:1 OR 1:1-2
		ver2 = '\\d+:\\d+(?:\\s?[-–&]\\s?\\d+)?',     // NOT 1, 1:1 OR 1:1-2
		regexPattern = '\\b(?:('+vol+')\\s+)?('+bok+')\.?\\s+('+ver+'(?:\\s?,\\s?'+ver+')*)'+'(?:\\s?;\\s?'+ver2+')*\\b',
		referenceRegex = new RegExp(regexPattern, "m"),
		skipRegex = /^(a|script|style|textarea)$/i,
		textHandler = function(node) {
			var match = referenceRegex.exec(node.data), 
				val, 
				referenceNode, 
				afterReferenceNode,
				newLink,
				refText,
				shortenedRef;
			
			if (match) {
				val = match[0];
				// see https://developer.mozilla.org/en/DOM/text.splitText
				// split into three parts [node=before][referenceNode][afterReferenceNode]
				referenceNode = node.splitText(match.index);
				afterReferenceNode = referenceNode.splitText(val.length);
				
				// send the matched text down the 
				newLink = createLinksFromNode(node, referenceNode);
				
				return newLink;
			} else {
				return node;
			}
		},
		createLinksFromNode = function(node, referenceNode) {
			// split up match by ; and , characters and make a unique link for each
			var 
				newLink,
				shortenedRef,
				commaIndex = referenceNode.textContent.indexOf(','),
				semiColonIndex = referenceNode.textContent.indexOf(';'),
				separatorIndex = (commaIndex > 0 && semiColonIndex > 0) ? Math.min(commaIndex, semiColonIndex) : Math.max(commaIndex, semiColonIndex),
				separator,
				remainder,
				reference,
				startRemainder;
			
			// if there is a separator ,; then split up into three parts [node][separator][after]
			if (separatorIndex > 0) {
				separator = referenceNode.splitText(separatorIndex);
				
				startRemainder = 1;
				while(startRemainder < separator.textContent.length && separator.textContent.substring(startRemainder,startRemainder+1) == ' ')
					startRemainder++;
				
				remainder = separator.splitText(startRemainder);
			}	
			
			// replace the referenceNode TEXT with an anchor node
			newLink = node.ownerDocument.createElement('A');				
			node.parentNode.replaceChild(newLink, referenceNode);			
			refText = referenceNode.textContent;	
			reference = parseReference(refText);			
			newLink.setAttribute('href', reference.shortUrl());
			newLink.setAttribute('title', 'Read ' + reference.toString());				
			newLink.setAttribute('class', bibly.className);
			newLink.appendChild(referenceNode);
			
			// if there was a separator, now parse the stuff after it
			if (remainder) {				
				newLink = createLinksFromNode(node, remainder);				
			}	
			
			return newLink;
		},
		parseReference= function(refText) {
			// temp small node
			return {
				refText: refText,
				shortUrl: function() {
					return 'http://bib.ly/' + refText.replace(/\s/ig,'').replace(/:/ig,'.').replace(/�/ig,'-');
				},
				toString: function() {
					return refText;
				}
			};
		}
	
	function parseDocument() {
		traverseDOM(document.body, 1, textHandler);
	}
	function traverseDOM(node, depth, textHandler) {
		var count = 0;
			
		while (node && depth > 0) {
			count++;
			if (count >= bibly.max_nodes) {
				setTimeout(function() { traverseDOM(node, depth, textHandler); }, 50);
				return;
			}

			switch (node.nodeType) {
				case 1: // ELEMENT_NODE
					if (!skipRegex.test(node.tagName) && node.childNodes.length > 0) {
						node = node.childNodes[0];
						depth ++;
						continue;
					}
					break;
				case 3: // TEXT_NODE
				case 4: // CDATA_SECTION_NODE
					node = textHandler(node);
					break;
			}

			if (node.nextSibling) {
				node = node.nextSibling;
			} else {
				while (depth > 0) {
					node = node.parentNode;
					depth --;
					if (node.nextSibling) {
						node = node.nextSibling;
						break;
					}
				}
			}
		}
	}	

    if (window.attachEvent) {
        window.attachEvent('onload', parseDocument);
    } else if (window.addEventListener) {
        window.addEventListener('load', parseDocument, false);
    } else {
        __onload = window.onload;
        window.onload = function() {
           parseDocument();
            __onload();
        };
    }	
	
	
})();