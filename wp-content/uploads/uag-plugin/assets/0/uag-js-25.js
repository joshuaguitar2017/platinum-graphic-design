document.addEventListener("DOMContentLoaded", function(){ var selector = document.querySelectorAll( '.uagb-block-a8f494f5' );
if ( selector.length > 0 ) {

	var blockquote__tweet = selector[0].getElementsByClassName("uagb-blockquote__tweet-button");

	if ( blockquote__tweet.length > 0 ) {

		blockquote__tweet[0].addEventListener("click",function(){	
			var request_url = "https://twitter.com/intent/tweet?text=PGD+%E2%80%94+Author+Name&url=https%3A%2F%2Fwww.platinumgraphicdesign.com%2Fcontact%2F";
			window.open( request_url );
		});
	}
}
 });