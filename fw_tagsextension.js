function search_for_tag() {
    $("#fw_tagsextension").remove();
    $(".ccm-block-page-list-page-entry").each(function(i,obj) {
        var tdiv = $(this).find(".ccm-block-page-list-title");
        var tdesc = $(this).find(".ccm-block-page-list-description").context.innerText;
        var tclass = $("<span />");
        
        tclass.css({"margin-left":"10px","border":"1px solid black","border-radius":"2px","font-weight":"400","font-size":"90%","padding-left":"8px","padding-right":"8px","color":"#ffffff"});

        if(tdesc.indexOf("Adult;")!==-1) {
            tclass.css({"background-color":"#bf2e2e"});
            tclass.append("Content Warning");
        }
        else if(tdesc.indexOf("Adult.")!==-1) {
            tclass.css({"background-color":"#327fc7"});
            tclass.append("Adult");
        }
        else if(tdesc.indexOf("Adult ")!==-1) {
            tclass.css({"background-color":"#327fc7"});
            tclass.append("Adult");
        }
        else if(tdesc.indexOf("Clean.")!==-1) {
            tclass.css({"background-color":"#32c775"});
            tclass.append("Clean");
        }
        else {
            tclass.css({"background-color":"#80aed9"});
            tclass.append("Untagged");
        }
        tdiv.append(tclass);
        if(tdesc.indexOf("clean variant")!==-1) {
            var tclass_b = $("<span />",{"text":"Clean"});
            tclass_b.css({"background-color":"#32c775","border":"1px solid black","border-radius":"2px","font-weight":"400","font-size":"90%","padding-left":"8px","padding-right":"8px","color":"#ffffff"});
            tdiv.append("/");
            tdiv.append(tclass_b);
        }

        // Now let's do this for drafts...
        var dclass = $("<span />");
        dclass.css({"margin-left":"10px","border":"1px solid black","border-radius":"2px","font-weight":"400","font-size":"90%","padding-left":"8px","padding-right":"8px","color":"#ffffff"});
        var any_draft = false;
        if(tdesc.indexOf("This is an incomplete draft")!==-1) {
            dclass.css({"background-color":"#bf2e2e"});
            dclass.append("Incomplete");
            any_draft = true;
        }
        else if(tdesc.indexOf("This is a first draft")!==-1) {
            dclass.css({"background-color":"#327fc7"});
            dclass.append("Rough draft");
            any_draft = true;
        }
        else if(tdesc.indexOf("This is a second draft")!==-1) {
            dclass.css({"background-color":"#32c775"});
            dclass.append("Edited");
            any_draft = true;
        }
        else {
            dclass.append("None");
        }

        if(any_draft==true) {
            tdiv.append(dclass);
        }
    });
}