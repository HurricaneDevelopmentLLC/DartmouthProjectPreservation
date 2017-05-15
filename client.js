var headerPagesList = document.getElementById('section-header').getElementsByTagName('a');
var l = headerPagesList.length;

var HurDevCFunc = () => {
	for (var i = 0;i < l;i++) {
	    var imgDiv = headerPagesList[i].getElementsByClassName('img')[0];
	    if (typeof imgDiv === 'undefined')
	    	continue;

	    var img = imgDiv.getElementsByTagName('img')[0];
	    //console.log(imgDiv);

	    console.log(parseFloat(window.getComputedStyle(headerPagesList[i],null).width) * 1.5);
	    imgDiv.style.height = parseFloat(window.getComputedStyle(headerPagesList[i],null).width) * 1.5 + "px";
	    console.log(parseFloat(window.getComputedStyle(img,null).width) / -2.0);
	    img.style.marginLeft = parseFloat(window.getComputedStyle(img,null).width) / -2.0 + "px";
	}
}

var anchorScroll = (event) => {
	console.log("TagName: ", event.currentTarget.tagName.toLowerCase());
	if (event.currentTarget.tagName.toLowerCase() === 'a') {
	    event.preventDefault();

	    var target = event.currentTarget.attributes;

	    document.querySelector(target.href.value).scrollIntoView({
	    	behavior: 'smooth'
	    });
	}
};

for (var i = 0;i < l;i++) {
	console.log(headerPagesList[i]);
	headerPagesList[i].addEventListener('click', anchorScroll, false);
}

var topLinks = document.getElementById('section-pages').getElementsByClassName('seperator');

var linkToTop = (event) => {
	document.querySelector('#canvasWrapper').scrollIntoView({
    	behavior: 'smooth'
    });
};

for (var i = 0;i < topLinks.length;i++) {
	topLinks[i].addEventListener('click', linkToTop, false);
}

var resizing = false;
var resizeID;

var stopResize = () => {
	HurDevCFunc();

	setTimeout(function() {
		//var headerPagesList = document.getElementById('section-header').getElementsByTagName('a');
		//var l = headerPagesList.length;

		for (var i = 0;i < l;i++) {
		    var imgDiv = headerPagesList[i].getElementsByClassName('img')[0];
		    if (typeof imgDiv === 'undefined')
		    	continue;

		    var img = imgDiv.getElementsByTagName('img')[0];
		    
		    img.classList.remove('no-transition');
		}
	}, 750);

	resizing = false;
};

window.onresize = function() {
	if (!resizing) {
		//var headerPagesList = document.getElementById('section-header').getElementsByTagName('a');
		//var l = headerPagesList.length;

		for (var i = 0;i < l;i++) {
		    var imgDiv = headerPagesList[i].getElementsByClassName('img')[0];
		    if (typeof imgDiv === 'undefined')
		    	continue;

		    var img = imgDiv.getElementsByTagName('img')[0];
		    
		    img.classList.add('no-transition');
		}

		resizing = true;
	}
	
	clearTimeout(resizeID);
	resizeID = setTimeout(stopResize, 500);
};

HurDevCFunc();