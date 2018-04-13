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
    console.log('Bulk Add AS Attributes Loading');
    window.addEventListener("hashchange", setupBulkAddAttributesButton, false);

    function setupBulkAddAttributesButton() {
        if (location.hash.indexOf('#audience-stream/attributes') != -1) {
            //Add the button
            if (!$('#bulkAddAttributes').length) {
                $('<button class="btn btn-primary" id="bulkAddAttributes">Bulk Add Attributes</button>')
                    .prependTo('.actionGroup')
                    .click(function () {
                        var bulkAddAttributes = new gApp.views.SimpleModalView({
                            model: new Backbone.Model({
                                title: "Bulk Add Attributes",
                                message: "<textarea cols='65' rows='35' id='bulkAddAttributesTestarea'></textarea>",
                                buttons: [{
                                    text: 'Submit',
                                    location: 'right',
                                    handler: function () {
                                        //console.log($(bulkAddAttributes.$el).find('#bulkAddAttributesTestarea').val());
                                        teal.configureAttribute(JSON.parse($(bulkAddAttributes.$el).find('#bulkAddAttributesTestarea').val()));
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
    console.log('Bulk Add AS Attributes Loaded');
} catch (e) {
    console.log('Bulk Add AS Attributes Failed: ' + e);
}
/************** Bulk Add AS Attributes End ***************************/