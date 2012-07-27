var OData = require('../lib'),
    assert = require('assert');

describe('odata', function () { 

    it("should create odata object", function () {
        var odata = OData("http://services.odata.org/OData/OData.svc/");
        assert.equal(odata.uri, "http://services.odata.org/OData/OData.svc");

        odata = OData("http://services.odata.org/OData/OData.svc");
        assert.equal(odata.uri, "http://services.odata.org/OData/OData.svc");

        odata = OData({
            root: 'http://services.odata.org/OData/OData.svc',
            resource: 'Categories(1)',
            links: 'Products'
        });
        assert.equal(odata.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/$links/Products");

        odata = OData({
            root: 'http://services.odata.org/OData/OData.svc',
            resource: 'Products'
        }, { dataType: 'jsonp' });
        assert.equal(odata.uri, "http://services.odata.org/OData/OData.svc/Products?$callback=resultCallback&$format=json");
    });

    it("should Addressing Entries", function () {
        var odata = OData("http://services.odata.org/OData/OData.svc/"), q;

        q = odata.from("Categories(1)");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)");

        q = odata.from("Categories(1)/Name");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/Name");

        q = odata.from("/Categories(1)/Name/");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/Name");

        q = odata.from('Categories(1)/Products/').count(false);
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/Products/$count");

        q = odata.from('Categories(1)/Products(1)/Supplier/Address/City').value(false);
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/Products(1)/Supplier/Address/City/$value");
    });

    it("should Addressing Links between Entries", function () {
        var odata = OData("http://services.odata.org/OData/OData.svc"), q;
        q = odata.from("Categories(1)").links("Products");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/$links/Products");

        q = odata.from("Products(1)").links("Category");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products(1)/$links/Category");
    });

    it("should Addressing Service Operations", function () {
        var odata = OData("http://services.odata.org/OData/OData.svc"), q;

        q = odata.from("ProductColors");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/ProductColors");

        q = odata.from("ProductsByColor").params({ color: "'red'" });
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/ProductsByColor?color='red'");

        q = odata.from("ProductsByColor(3)/Category/Name").params({ color: "'red'" });
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/ProductsByColor(3)/Category/Name?color='red'");

        q = odata.from("ProductsByColor").params({ color: "'red'", param: 'foo' });
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/ProductsByColor?color='red'&param=foo");

        odata = OData("http://localhost:32751/services/AdventureWorks.svc");
        q = odata.from("GetProductsByColor(706)/ProductNumber/").params({ color: "'red'" }).value(false);
        assert.equal(q.uri, "http://localhost:32751/services/AdventureWorks.svc/GetProductsByColor(706)/ProductNumber/$value?color='red'");

        q = odata.from("GetProductsByColor").params({ color: "'red'" }).orderby("Name");
        assert.equal(q.uri, "http://localhost:32751/services/AdventureWorks.svc/GetProductsByColor?$orderby=Name&color='red'");
    });

    it("should Query String Options", function () {
        var odata = OData("http://services.odata.org/OData/OData.svc"), q;
        q = odata.from("Products").orderby("Rating");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$orderby=Rating");

        q = odata.from("Products").orderby("Rating asc");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$orderby=Rating asc");

        q = odata.from("Products").orderby("Rating,Category/Name desc");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$orderby=Rating,Category/Name desc");

        q = odata.from("Products").top(5);
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$top=5");

        q = odata.from("Products").top(5).orderby("Name desc");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$orderby=Name desc&$top=5");

        q = odata.from("Categories(1)/Products").skip(2);
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories(1)/Products?$skip=2");

        q = odata.from("Products").skip(2).top(2).orderby("Rating");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$orderby=Rating&$skip=2&$top=2");

        q = odata.from("Suppliers").filter("Address/City eq 'Redmond'");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Suppliers?$filter=Address/City eq 'Redmond'");

        q = odata.from("Categories").expand("Products");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories?$expand=Products");

        q = odata.from("Categories").expand("Products/Suppliers");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories?$expand=Products/Suppliers");

        q = odata.from("Products").expand("Category,Suppliers");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$expand=Category,Suppliers");

        q = odata.from("Products").select("Price,Name");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$select=Price,Name");

        q = odata.from("Products").select("Name,Category");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$select=Name,Category");

        q = odata.from("Categories").select("Name,Products").expand("Products/Suppliers");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Categories?$expand=Products/Suppliers&$select=Name,Products");

        q = odata.from("Products").select("*");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$select=*");

        q = odata.from("Products").inlinecount();
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$inlinecount=allpages");

        q = odata.from("Products").inlinecount("allpages");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$inlinecount=allpages");

        q = odata.from("Products").inlinecount(false);
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products");

        q = odata.from("Products").inlinecount().top(10).filter("Price gt 200");
        assert.equal(q.uri, "http://services.odata.org/OData/OData.svc/Products?$filter=Price gt 200&$inlinecount=allpages&$top=10");

    });
});
