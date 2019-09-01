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
            tclass.append("None");
        }
        tdiv.append(tclass);
    });
}