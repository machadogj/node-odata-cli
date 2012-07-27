var odataUri = require('../lib/odataUri'),
    assert = require('assert');

describe('odata uri', function () { 
    it("parses uris, and writes it back to string", function () {
        var uri = odataUri(),
            actual,
            input,
            expected;

        // both new and current are absolute uris
        uri.segments.root = "http://services.odata.org/OData/OData.svc";
        expected = "http://services.odata.org/OData/OData.svc/Category(1)/Products";
        input = "http://services.odata.org/OData/OData.svc/Category(1)/Products/";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // both new and current are relative uris
        uri.segments.root = "/OData/OData.svc";
        expected = input = "/OData/OData.svc/Category(1)/Products";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // new is relative, current is absolute uris
        uri.segments.root = "http://services.odata.org/OData/OData.svc";
        input = '/OData/OData.svc/Category(1)/Products';
        expected = "http://services.odata.org/OData/OData.svc/Category(1)/Products";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // new is absolute, current is relative
        uri.segments.root = "/OData/OData.svc";
        input = "http://services.odata.org/OData/OData.svc/Category(1)/Products/";
        expected = "/OData/OData.svc/Category(1)/Products";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        uri.segments.root = "/OData/OData.svc";

        // detect $count                
        expected = input = "/OData/OData.svc/Category(1)/Products/$count";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $value
        expected = input = "/OData/OData.svc/Categories(1)/Products(1)/Supplier/Address/City/$value";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $links
        expected = input = "/OData/OData.svc/Categories(1)/$links/Products";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $orderby
        expected = input = "/OData/OData.svc/Products?$orderby=Name,ReleaseDate desc";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $orderby, $skip
        expected = input = "/OData/OData.svc/Products?$orderby=Name,ReleaseDate desc&$skip=50";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $orderby, $top
        expected = input = "/OData/OData.svc/Products?$orderby=Name,ReleaseDate desc&$skip=50&$top=20";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $orderby, $skip, $top, $filter
        expected = input = "/OData/OData.svc/Products?$filter=not endswith(Description,'milk')&$orderby=Name,ReleaseDate desc&$skip=50&$top=20";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $orderby, $skip, $top, $filter, $expand
        expected = input = "/OData/OData.svc/Products?$expand=Category&$filter=not endswith(Description,'milk')&$orderby=Name,ReleaseDate desc&$skip=50&$top=20";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $select
        expected = input = "/OData/OData.svc/Products?$select=Name,Description";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $inlinecount
        expected = input = "/OData/OData.svc/Products?$inlinecount=allpages";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect $format
        expected = input = "/OData/OData.svc/Products?$format=text";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);

        // detect custom parameters and service operations
        expected = input = "/OData/OData.svc/ProductsByColor?color='red'";
        actual = uri.parse(input);
        assert.equal(actual.toString(), expected);
    });
});
