var bibly = (window.bibly) ? window.bibly : {};
bibly.version = '0.1';
bibly.max_nodes =  500;
bibly.className = 'bibly_reference';

(function() {

	// book names list
	// adapted from old scripturizer.js code
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
		ver = '\\d+(:\\d+)?(?:\\s?[-&]\\s?\\d+)?',
		regexPattern = '\\b(?:('+vol+')\\s+)?('+bok+')\.?\\s+('+ver+'(?:\\s?,\\s?'+ver+')*)\\b',
		referenceRegex = new RegExp(regexPattern, "m"),
		skipRegex = /^(a|script|style|textarea)$/i,
		textHandler = function(node) {
			var match = referenceRegex.exec(node.data), 
				val, 
				referenceNodePlusRemainder, 
				afterReferenceNode,
				newLink,
				refText,
				shortenedRef;
			
			if (match) {
				val = match[0];
				referenceNodePlusRemainder = node.splitText(match.index);
				afterReferenceNode = referenceNodePlusRemainder.splitText(val.length);
				newLink = node.ownerDocument.createElement('A');
				
				//newLink.innerText = 'test';
				
				node.parentNode.replaceChild(newLink, referenceNodePlusRemainder);				
				newLink.className = bibly.className;
				newLink.appendChild(referenceNodePlusRemainder);
				
				refText = newLink.innerText;
				shortenedRef = refText.replace(/\s/ig,'').replace(/:/ig,'.');
				
				newLink.setAttribute('href', 'http://bib.ly/' + shortenedRef);
				newLink.setAttribute('title', 'Read ' + refText);
				return newLink;
			} else {
				return node;
			}
		};
	
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