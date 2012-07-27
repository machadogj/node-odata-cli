var OData = require('../lib'),
	assert = require('assert');

describe('netflix odata integration tests', function () { 
	it('should query for titles', function ( done ) {
		OData("http://odata.netflix.com/Catalog").beforeSend(getToken)
			.from('Titles')
			.skip(2)
			.top(2)
			.select("Name,Synopsis")
			.query(function (res) {
			    assert.equal(res.d.length, 2);
			    console.log(res);
			    done();
			}});
	});
});

