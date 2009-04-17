// Webサイト上のサンプルの検証用

function testAssertRaises()
{
	var loader = {};

	loader.INVALID_URI_ERROR = new Error('invalid uri');
	loader.open = function(aURI) {
	  if (aURI) this.uri = aURI;
	  if (!/^https?:/.test(this.uri))
	    throw this.INVALID_URI_ERROR;
	  window.open(this.uri);
	};
	loader.uri = 'mailto:test@example.com';

	assert.raises(
	  loader.INVALID_URI_ERROR,
	  loader.open,
	  loader
	);
	assert.raises(
	  loader.INVALID_URI_ERROR,
	  function() {
	    loader.open('ftp://ftp.example.com');
	  },
	  {}
	);
}

function testAssertFinishesWithin()
{
	var loadAndParse = function(aURI) {
			return;
		};

	var manager = {
	    tasks : [],
	    func  : loadAndParse,
	    timer : null,
	    start : function() {
	      this.timer = window.setInterval(function(aSelf) {
	          if (!aSelf.tasks.length) {
	            window.clearInterval(aSelf.timer);
	            return;
	          }
	          aSelf.func(aSelf.tasks.shift());
	        }, 10, this);
	    }
	  };
	manager.tasks.push('http://www.example.com/');
	manager.tasks.push('http://www.example.jp/');
	manager.tasks.push('http://www.example.net/');

	yield Do(assert.finishesWithin(
	    10 * 1000, // 10sec.
	    function() {
	      manager.start();
	      while (manager.tasks.length) {
	        yield 100;
	      }
	    },
	    {}
	  ));
}


function test$X()
{
	var disabledItems = $X(
	      '/descendant::*[local-name()="menuitem" and @disabled="true"]',
	      document
	    );
	disabledItems.forEach(function(aItem) {
	  assert.isTrue(aItem.disabled);
	});
}
