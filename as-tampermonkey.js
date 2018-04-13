// ==UserScript==
// @name         AS Bulk Add Attribute
// @namespace    AudienceStream
// @require      https://raw.githubusercontent.com/zwinschmann/udh-automations/master/as-bulk-add-attribute.js
// @version      0.1
// @description  Automation of visitor/visit level attribbute creation
// @author       Sven Meyer
// @include      http*//my.tealiumiq.com/datacloud/*
// ==/UserScript==

/************** Bulk Add AS Attributes Start ***************************/
try {
    console.log('AS Bulk Add Attributes Scripts Loading');

    var script = document.createElement('script');
    script.onload = function () {
        console.log('AS Bulk Add Attributes Scripts Loaded');
    };
    script.src = "https://raw.githubusercontent.com/zwinschmann/udh-automations/master/as-bulk-add-attribute.js";
    document.head.appendChild(script);    

    window.addEventListener("hashchange", setupBulkAddAttributesButton, false);

    function addBulkAddAttributesButton() {
        if (location.hash.indexOf('#audience-stream/attributes') != -1) {
            //Add the button
            if (!$('#bulkAddAttributes').length) {
                $('<button class="btn btn-primary" id="bulkAddAttributes">Bulk Add Attributes</button>')
                    .prependTo('.actionGroup')
                    .click(function () {
                        var bulkAddAttributes = new gApp.views.SimpleModalView({
                            model: new Backbone.Model({
                                title: "Bulk Add Attributes",
                                message: "<textarea cols='60' rows='30' id='bulkAddAttributesTextarea'></textarea>",
                                buttons: [{
                                    text: 'Submit',
                                    location: 'right',
                                    handler: function () {
                                        //console.log($(bulkAddAttributes.$el).find('#bulkAddAttributesTestarea').val());
                                        if(!teal) throw new Error('Tealium Scope Does Not Exist');
                                        else teal.addAttribute(JSON.parse($(bulkAddAttributes.$el).find('#bulkAddAttributesTextarea').val()));
                                    }
                                }]
                            })
                        });
                        //alert("Executing Config Attributes Function");
                        gApp.utils.modal.show(bulkAddAttributes);
                    });
            }
        }
    }
    console.log('AS Bulk Add Attributes Button Added');
} catch (e) {
    console.log('AS Bulk Add Attributes Script Failed: ' + e);
}
/************** Bulk Add AS Attributes End ***************************/