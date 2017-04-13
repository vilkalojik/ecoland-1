(function () {
    console.log('Hello World from new.js!');
    $('#circle').circleProgress({
	    value: 0.75,
	    size: 200,
	    fill: {
	      gradient: ["red", "orange"]
	    }
	  });
})();
