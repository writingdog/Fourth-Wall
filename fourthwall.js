"use strict";
var fw_version_no = "0.82.0";
var fw_story_raw_data;
var fw_last_changed_frame;
var fw_story_xml;
var fw_story_title;
var fw_story_author;
var fw_story_name; //this is the name that will be used to fetch comments
var fw_story_ids = [];
var fw_story_variables = {};
var fw_story_section_variants = {};
var fw_story_section_variants_status_change = {};
var fw_hint_text = {};
var fw_hint_colors = {};
var fw_hint_spoiler = {}; // true if the hint is marked as a 'spoiler'
var fw_hint_interlink = {}; // true if the hint is marked as containing an interlink to another story
var fw_comments = {};
var fw_show_missing = false; //set to "false" to hide missing frames.
var fw_debug_start = 0;
var fw_story_frames_full = {};
var hint_active = false;
var paragraph_color = "";
var fw_fadein_highlight_color = "#77D8FF";
var fw_hint_fade = .3; // The alpha value for non-selected hints when a hint is selected.
var fw_comment_selected_para = "";
var fw_logged_in_uname = "";
var fw_comment_active = false;
var fw_comment_click_active = false;
var fw_admin_logged_in = false;
var fw_print_version = false;
var fw_hint_id;
var fw_cancel_char = "\u274c";
var fw_post_comment_char = "&#128172;";
var fw_post_comment_restricted_char = "&#128173;";
var fw_api_path = "/fourthwall/";
var fw_offline_mode = false; // Disable story and comment loads.


function fw_load_story(filename) {
	if(fw_offline_mode==false) {
		var xmlHTTP = new XMLHttpRequest();
		try {
			xmlHTTP.open("GET",filename,false);
			xmlHTTP.send(null);
		}
		catch (e) {
			window.alert("Unable to load the story object.");
			window.alert(e);
			return;
		}
		fw_story_raw_data = xmlHTTP.responseText;
		fw_story_xml = $.parseXML(fw_story_raw_data);
	}
	else {
		fw_story_raw_data = fw_offline_xml.replace(/\[n\]/g,"\n");
		fw_story_xml = $.parseXML(fw_story_raw_data);
	}
}

function fw_add_hints(text) {
/* 
"hints" are little bits of extra information that appear when the reader mouses over them.
They are defined in the story as surrounded by double brackets, as in [[hint|1]].
"Hint" is the text that will appear in-line; "1" is a reference to the hint as defined in the story XML.
This function goes through the text, and replaces every instance of those square brackets.
It surrounds them in a <span> that calls fw_do_hint on onmouseover() and onmouseout().
It also adds a background color.

Returns: a string, containing the source text but with every [[hint text|number]] pair replaced
*/
	var hint_reg = new RegExp("\\[\\[(.+?)\\]\\]","g");
	var result;
	var hint;
	var hint_text = text;
	while ((result = hint_reg.exec(hint_text)) !== null) {
		hint = result[1].split("|");
		//hint = ;
		if(fw_print_version==false) {
			//alert(hint_text);
			//var hint_span = $("<span />")
			if(fw_hint_spoiler[hint[1]]==true) {
				hint_text = hint_text.replace(result[0],"<span class='fw_hint_spoiler' id='fw_hint_inline_"+hint[1]+"' style='background-color:"+fw_hint_colors[hint[1]]+"FB;' onclick='fw_do_hint(event,"+hint[1]+")'>"+hint[0]+"</span>");
			}
			else {
				hint_text = hint_text.replace(result[0],"<span class='fw_hint' id='fw_hint_inline_"+hint[1]+"' style='background-color:"+fw_hint_colors[hint[1]]+"FB;' onclick='fw_do_hint(event,"+hint[1]+")'>"+hint[0]+"</span>");
			}
		}
		else {
			//alert(hint_text);
			hint_text = hint_text.replace(result[0],"<span>"+hint[0]+"</span>");		
		}
	}
	return hint_text;
}

function fw_add_hint_controller() {
	if(hint_active==false) {
		$(".fw_hint_controller").remove();
		return;
	}
	$(".fw_hint_controller").remove();
	var controller = $("<div />",{"class":"fw_hint_controller"});
	var earlier = $("<div />",{"class":"fw_hint_controller_button","id":"fw_hint_controller_previous_comment","alt":"Go to previous comment"});
	//$(earlier).css({"right":"1.8em"});
	var close = $("<div />",{"class":"fw_hint_controller_button","id":"fw_hint_controller_close_comment","alt":"Close comment"});
	//$(close).css({"right":"4.2em","background-color":"var(--hint_button_close)"});
	$(close).on("click",{arg1:event,arg2:fw_hint_id},function(e) { fw_do_hint(e.data.arg1,e.data.arg2)});

	var jump = $("<div />",{"class":"fw_hint_controller_button","id":"fw_hint_controller_jump_to_position","alt":"See position in story"});
	//$(jump).css({"right":"6.2em","background-color":"var(--hint_button_jump)"});
	$(jump).css({"background-color":fw_hint_colors[fw_hint_id]});
	$(jump).on("click",{arg1:event,arg2:fw_hint_id},function(e) { fw_hint_scroll("#fw_hint_inline_"+e.data.arg2); });
	
	var later = $("<div />",{"class":"fw_hint_controller_button","id":"fw_hint_controller_next_comment","alt":"Go to next comment"});

	/**
	 * If we are past hint 1, then we need to add a hint event handler to the earlier button
	 * 
	 * If we are before the last hint, then we also need to add a hint event handler to the later button
	 */
	if(fw_hint_id>1) {
		var n_hint = fw_hint_id-1;
		$(earlier).on("click",{arg1:event,arg2:n_hint},function(e) { fw_hint_scroll("#fw_hint_inline_"+e.data.arg2); fw_do_hint(e.data.arg1,e.data.arg2)});
	}
	else {
		$(earlier).css({"background-color":"var(--hint_button_inactive)"});
	}
	if(fw_hint_id<(Object.keys(fw_hint_text).length)) {
		var n_hint = fw_hint_id+1;
		$(later).on("click",{arg1:event,arg2:n_hint},function(e) { fw_hint_scroll("#fw_hint_inline_"+e.data.arg2); fw_do_hint(e.data.arg1,e.data.arg2)});
	}
	else {
		$(later).css({"background-color":"var(--hint_button_inactive)"});
	}
	$(controller).append(earlier);
	$(controller).append(later);
	$(controller).append(close);
	$(controller).append(jump);
	//var fw_hintbox_height = $("#hint_te")
	//$(controller).css({"bottom":})
	$("#fw_hint_container").prepend(controller)
}

function fw_do_hint(evt,id) {
	//console.log(evt);
	evt.preventDefault();
	evt.stopPropagation();
	if(hint_active===false) {
		$("#hint_textbox").css("background-color",fw_hint_colors[id]);
		// New block in FW 0.50 : When a hint is selected, this fades the background for all OTHER hints.
		fw_do_hint_fade(id);
		// End new block.
		$("#hint_textbox,#fw_hint_container").show();
		if(fw_hint_interlink[id]===true) {
			// New in FW 0.60: Story interlink handling.
			var smids = Object.keys(fw_storymap); // This should be defined in a separate, included file.
			var hint_interlink_text = fw_hint_text[id];
			if(smids.length==0) { 
				$("#hint_textbox").html(fw_hint_text[id]); // If for some reason fw_storymap is undefined
			}
			else {
				for(var i=0;i<smids.length;i++) {
					var itxt = smids[i]; // This is the story ID ("+moby_dick+") that we're trying to replace.
					var rtxt = fw_storymap[smids[i]][0];
					var rq = "";
					if(rtxt.substr(-7)=="&rdquo;") {
						rtxt = rtxt.substr(0,rtxt.length-7);
						rq = "&rdquo;";
					} // i.e. the story's given title ends with a quote mark. So we strip this for the purposes of replacement.
					var itr = new RegExp("\\+"+itxt+"\\+"+"([.?!,])?","g");

					var link_string = "<div class=\"fw_interlink_container\">"; // Add a hyperlink for each defined link in the link map
					link_string += rtxt+"$1"+rq+" "; // Insert the story title at the start of the div, so that it will be wrapped appropriately.
					for(var j=0;j<fw_storymap[smids[i]][1].length;j++) {
						link_string += "<span class=\"fw_interlink\"><a href=\""+fw_storymap[smids[i]][1][j][1]+"\">"+fw_storymap[smids[i]][1][j][0]+"</a></span>";
					}
					link_string += "</div>";
					// At the conclusion of the for loop, we should have a link string that looks like for example
					// <a href=$VALID SO FURRY HYPERLINK>SoFurry</a> <a href=$VALID SMASHWORDS LINK>SmashWords</a>
					
					hint_interlink_text = hint_interlink_text.replace(itr,link_string);
				}
			}
			$("#hint_textbox").html(hint_interlink_text);
		}
		else {
			$("#hint_textbox").html(fw_hint_text[id]);
		}
		hint_active=true;
		fw_hint_id=id;
	}
	else {
		if(id===undefined || id===fw_hint_id) {
			$("#hint_textbox,#fw_hint_container").fadeOut();
			fw_hint_id="";
			// New block in FW 0.50 : When a hint is selected, this fades the background for all OTHER hints.
			fw_do_hint_fade();
			// End new block.
			hint_active=false;
		}
		else {
			// New block in FW 0.50 : When a hint is selected, this fades the background for all OTHER hints.
			fw_do_hint_fade(id);
			// End new block.
			$("#hint_textbox").css("background-color",fw_hint_colors[id]);
			if(fw_hint_interlink[id]===true) {
				// New in FW 0.60: Story interlink handling.
				var smids = Object.keys(fw_storymap); // This should be defined in a separate, included file.
				var hint_interlink_text = fw_hint_text[id];
				if(smids.length==0) { 
					$("#hint_textbox").html(fw_hint_text[id]); // If for some reason fw_storymap is undefined
				}
				else {
					for(var i=0;i<smids.length;i++) {
						var itxt = smids[i]; // This is the story ID ("+moby_dick+") that we're trying to replace.
						var rtxt = fw_storymap[smids[i]][0];
						var rq = "";
						if(rtxt.substr(-7)=="&rdquo;") {
							rtxt = rtxt.substr(0,rtxt.length-7);
							rq = "&rdquo;";
						} // i.e. the story's given title ends with a quote mark. So we strip this for the purposes of replacement.
						var itr = new RegExp("\\+"+itxt+"\\+"+"([.?!,])?","g");
						var link_string = "<div class=\"fw_interlink_container\">"; // Add a hyperlink for each defined link in the link map
						link_string += rtxt+"$1"+rq+" "; // Insert the story title at the start of the div, so that it will be wrapped appropriately.
						for(var j=0;j<fw_storymap[smids[i]][1].length;j++) {
							link_string += "<span class=\"fw_interlink\"><a href=\""+fw_storymap[smids[i]][1][j][1]+"\">"+fw_storymap[smids[i]][1][j][0]+"</a></span>";
						}
						link_string += "</div>";
						// At the conclusion of the for loop, we should have a link string that looks like for example
						// <a href=$VALID SO FURRY HYPERLINK>SoFurry</a> <a href=$VALID SMASHWORDS LINK>SmashWords</a>
						
						hint_interlink_text = hint_interlink_text.replace(itr,link_string);
						//hint_interlink_text = hint_interlink_text.replace("+"+smids[i]+"+",fw_storymap[smids[i]][0]+" "+link_string);
					}
				}
				$("#hint_textbox").html(hint_interlink_text);
			}
			else {
				$("#hint_textbox").html(fw_hint_text[id]);
			}
			fw_hint_id=id;
		}
	}
	// Now append the hint controller.
	fw_add_hint_controller();
}

function fw_hint_scroll(id) {
	/*
	Scrolls the page to the specified anchor location.
	*/
	var ch = parseInt(window.innerHeight / 2);
	var hint_y = $(id)[0].offsetTop; // The window Y coordinate of the specified hint
	$("html, body").animate({ scrollTop: (hint_y-ch) },160); // Scroll to the hint position - half the page width, so it should appear in the middle of the page.
}

function fw_do_hint_fade(id) {
	/*
	Function to fade every hint but the currently active one.

	If id is not set, it will reset the RGBA values for all hints.
	*/
	if(id==undefined) {
		id = "reset_hint"; // We do this so that if we're turning off hints, it will never match the hint ID
	}
	$(".fw_hint,.fw_hint_spoiler").each(function() {
		var old_bg = $(this).css("background-color");
		if(old_bg.substr(0,4)=="rgba") {
			old_bg = old_bg.slice(5).split(",");
		}
		else {
			old_bg = old_bg.slice(4).split(",");
		}
		if(id=="reset_hint" || $(this).attr("id")=="fw_hint_inline_"+id) {
			var new_bg = "rgba("+old_bg[0]+","+parseInt(old_bg[1])+","+parseInt(old_bg[2])+","+1.0+")";
		}
		else {
			var new_bg = "rgba("+old_bg[0]+","+parseInt(old_bg[1])+","+parseInt(old_bg[2])+","+fw_hint_fade+")";
		}
		$(this).animate({backgroundColor:new_bg},200);
		//$(this).css({"background-color":new_bg});
	})
}

function fw_fade_in_paras(id,perform_fade) {
	var para_count = 0;
	for(var i=id;i<fw_story_ids.length;i++) {
//		alert("Fading id: "+fw_story_ids[i])
		if(fw_story_section_variants_status_change[fw_story_ids[i]]==true) {
			fw_story_section_variants_status_change[id]=false;
			$("#"+fw_story_ids[i]).find(".story_paragraph").each(function () {
				$(this).css("opacity",0);
				$(this).delay(700+(para_count*30)).animate({backgroundColor:fw_fadein_highlight_color,opacity:1},20,function() { $(this).delay(20).animate({backgroundColor:paragraph_color},50)});
				para_count++;
			});	
			
		}
	}
}

function fw_do_text_frame(id,content,nudges,debug) {
/*
This function updates a text frame (i.e. one of the <div> elements with a specified id.
It takes as arguments the text content and any "nudges". It then:

1. Finds any hints in the source text and calls a function to properly link them
2. Wraps every paragraph (separated by newlines) in a <p> tag
3. Loops through all nudges and properly links them by creating a nudge <span>
4. Updates the innerHTML of the given id <div>

Returns: nothing
*/
	//if(id=="150") { alert(content.text()); }
	var nudge_html = "";
	var nudge_id = "";
	var content_html = "";
	var max_num_paras;
	var num_nudges = 0;
	var content_arr = $(content).text().split("\n");
	for(var i=0;i<content_arr.length;i++) {
		if(content_arr[i].length>0) {
			var text_to_update = fw_add_hints(content_arr[i]);
			var para_id = "para_" + id + "_" + i;
			if(fw_print_version==true) {
				content_html+="<div class=\"story_paragraph\" id=\""+para_id+"\">"+text_to_update+"</div>";
			}
			else {
				content_html+="<div class=\"story_paragraph\" id=\""+para_id+"\" onload=\"fade_in('"+para_id+"')\" onclick=\"fw_comment(event,'"+para_id+"')\"><div class=\"num_comments\" onclick=\"fw_comments_show('"+para_id+"')\" style=\"display:none;\">0</div>"+text_to_update+"</div>";			
			}
			max_num_paras = i;
		}
	}
	//var frame_html = "<div class='story_text'>"+debug+content_html+"</div><div class='nudges' id='nudge_"+id+"'></div>";
	//$("#"+id).html(frame_html);
	$(nudges).find("nudge").each(function() {
		var nudge_type = $(this).find("inline").text();
		var nudge_default = $(this).find("default").text();
		var nudge_class = "nudge_choice";
		var debug_text = "";
		if(nudge_type==="true") {
			if(nudge_default==="true") {
				if(fw_print_version==true) { 
					content_html+="<div class=\"story_paragraph\" id=\""+para_id+"\">"+$(this).find("text").text()+"</div>";
					max_num_paras+=1;				
				}	
				else { nudge_class = "inline_default"; }
			}
			else {
				nudge_class = "inline_choice";
			}
		}
		nudge_id = "nudge_"+id+"_"+num_nudges;
		num_nudges++;
		if(fw_show_missing==true) {
			debug_text = " <span style=\"font-size: 70%;\">["+$(this).find("effect").text()+"]</span>";
		}
		else {
			debug_text = "";
		}
		if(fw_print_version==false) { nudge_html+="<span id='"+nudge_id+"' class=\""+nudge_class+"\" onclick=\"fw_nudge("+id+",'"+$(this).find("effect").text()+"','"+nudge_id+"','"+nudge_class+"')\">"+$(this).find("text").text()+debug_text+"</span>"; }
		//$("#nudge_"+id).append("<span id='"+nudge_id+"' class=\""+nudge_class+"\" onclick=\"fw_nudge("+id+",'"+$(this).find("effect").text()+"','"+nudge_id+"','"+nudge_class+"')\">"+$(this).find("text").text()+debug_text+"</span>");
	});
	var frame_html = "<div class='story_text'>"+debug+content_html+"</div><div class='nudges' id='nudge_"+id+"'>"+nudge_html+"</div>";
	$("#"+id).html(frame_html);
//	alert(nudges);
}

function fw_comment(e,id,override) {
	if(!override) { var override = false; }
	if(fw_logged_in_uname==="") {
		return;
	}
	if (fw_comment_click_active===false && override === false) {
		fw_comment_click_active = true;
		setTimeout(function() {fw_comment_click_active=false;},500);
		return;
	}
	document.getSelection().removeAllRanges();
	fw_comment_click_active = false;
	var active_para = "#"+id;
	//alert(fw_comments);
	if(fw_comment_selected_para==="") {
		if($(active_para).children(".fw_para_comment_box").html()==undefined){
			fw_comment_selected_para = id;
			$(active_para).attr("class","story_paragraph_commented");
			$(active_para).append("<div id=\"fw_para_comment_form\" style=\"width: 100%; margin: 0px;\"><textarea id=\"fw_para_commentfield\" class=\"divtextarea\"></textarea><span class=\"post_buttons\"><span onclick=\"fw_postcomment(0)\"><a title=\"Post comment (visible to all)\">"+fw_post_comment_char+"</a></span><span onclick=\"fw_postcomment(1)\"><a title=\"Post comment (visible to admins only)\">"+fw_post_comment_restricted_char+"</a></span><span onclick=\"fw_comment(this,'"+id+"',true)\"><a title=\"Cancel\">"+fw_cancel_char+"</a></span></span></div>");
		}
	}
	else {
		if(fw_comment_selected_para===id) {
			if($("#fw_para_commentfield").val()=="" || override==true) {
				$(active_para).attr("class","story_paragraph");
				$("#fw_para_comment_form").remove();
				fw_comment_selected_para="";
			}
		}
	}
}


function fw_postcomment(is_private) {
	var comment_text = $("#fw_para_commentfield").val();
	console.log(comment_text);
	console.log(encodeURI(comment_text));
	var xmlHTTP = new XMLHttpRequest();
	var params = "story="+fw_story_name+"&text="+encodeURIComponent(comment_text)+"&author="+fw_logged_in_uname+"&section_id="+fw_comment_selected_para+"&private="+is_private;
	try {
		xmlHTTP.open("POST", fw_api_path+"fw_post_comment.php", true);
		xmlHTTP.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHTTP.setRequestHeader("Content-length", params.length);
		xmlHTTP.onreadystatechange = function () {
			if(xmlHTTP.readyState == 4 && xmlHTTP.status == 200) {
				$("#"+fw_comment_selected_para).attr("class","story_paragraph");		
				$("#fw_para_comment_form").remove();
				fw_comment_selected_para="";
				fw_comments_load();
			}
		}
		xmlHTTP.send(params);
	}
	catch (e) {
		window.alert("Unable to load the requested file");
		return;
	}
}

function fw_comments_load() {
	fw_comments = {};
	var fw_comment_rawxml = "";
	var fw_comment_xml;
	if(fw_offline_mode==false) {
		/*
		 *	Execute this only if Fourth Wall is not running in local mode. 
		 */
		var xmlHTTP = new XMLHttpRequest();
		try {
			xmlHTTP.open("GET", fw_api_path+"fw_read_comments.php?story="+fw_story_name+"&author="+fw_logged_in_uname,false);
			xmlHTTP.onreadystatechange = function () {
				if(xmlHTTP.readyState == 4 && xmlHTTP.status == 200) {
					fw_comment_rawxml = xmlHTTP.responseText;
					fw_comment_xml = $.parseXML(fw_comment_rawxml);
					$(fw_comment_xml).find("comment").each(function () {
						var okay_to_load = true;
						if($(this).find("private").text()==1) {
							okay_to_load = false;
							if(fw_admin_logged_in==true || $(this).find("author").text() == fw_logged_in_uname) {
								okay_to_load = true;
							}
						}
						if(okay_to_load==true) {
							if(fw_comments[$(this).find("id").text()]===undefined) {
								fw_comments[$(this).find("id").text()] = [[$(this).find("author").text(),$(this).find("text").text(),$(this).find("uid").text(),$(this).find("private").text()]];
							}
							else {
								fw_comments[$(this).find("id").text()].push([$(this).find("author").text(),$(this).find("text").text(),$(this).find("uid").text(),$(this).find("private").text()]);
							}
						}
					});
					fw_updatecomments();
				}
			}
			xmlHTTP.send(null);
		}
		catch (e) {
			window.alert("Unable to load the requested file");
			return;
		}
	}
	else {
/**
 * If running in local mode, use a dummy comment block.
 */
		fw_comment_rawxml = fw_offline_comment;
		fw_comment_xml = $.parseXML(fw_comment_rawxml);
		$(fw_comment_xml).find("comment").each(function () {
			console.log(this);
			var okay_to_load = true;
			if($(this).find("private").text()==1) {
				okay_to_load = false;
				if(fw_admin_logged_in==true || $(this).find("author").text() == fw_logged_in_uname) {
					okay_to_load = true;
				}
			}
			if(okay_to_load==true) {
				if(fw_comments[$(this).find("id").text()]===undefined) {
					fw_comments[$(this).find("id").text()] = [[$(this).find("author").text(),$(this).find("text").text(),$(this).find("uid").text(),$(this).find("private").text()]];
				}
				else {
					fw_comments[$(this).find("id").text()].push([$(this).find("author").text(),$(this).find("text").text(),$(this).find("uid").text(),$(this).find("private").text()]);
				}
			}
		});
		fw_updatecomments();
	}
	
}

function fw_comments_delete(uid,id) {
	var xmlHTTP = new XMLHttpRequest();
	var params = "uid="+uid+"&story="+fw_story_name;
	try {
		xmlHTTP.open("POST", fw_api_path+"fw_delete_comment.php", true);
		xmlHTTP.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHTTP.setRequestHeader("Content-length", params.length);
		xmlHTTP.onreadystatechange = function () {
			if(xmlHTTP.readyState == 4 && xmlHTTP.status == 200) {
				fw_showcomment_undo(id);
				fw_comments_load();
			}
		}
		xmlHTTP.send(params);
	}
	catch (e) {
		window.alert("Unable to complete the request");
		return;
	}
}

function fw_comments_show(id) {
	var comments_text = "<hr class=\"fw_hr\" style=\"margin: 5px;\"/>";
	var comment_text;
	var comment_uid;
	var comment_delete;
	var comment_author;
	var comment_private;
	$("#"+id).attr("class","story_paragraph_commented");
	$("#"+id).children(".num_comments").css("display","none");
	if(fw_comments[id]!=undefined) {
		comments_text = comments_text + "<ul>";
		for(var comment in fw_comments[id]) {
			comment_uid = fw_comments[id][comment][2];
			comment_text = fw_comments[id][comment][1];
			comment_author = fw_comments[id][comment][0];
			comment_private = fw_comments[id][comment][3];
			if(fw_logged_in_uname!="") {
				if(fw_logged_in_uname==comment_author || fw_admin_logged_in == true) {
					comment_delete = "<span class=\"comment_delete_button\" onclick=\"fw_comments_delete('"+comment_uid+"','"+id+"')\">"+fw_cancel_char+"</span>";
				}
				else {
					comment_delete = "";
				}
			}
			else { 
				comment_delete = "";
			}
			if(comment_private==1) {
				comments_text = comments_text + "<li class=\"private_comment_box\">" + comment_text + comment_delete + "</li>";		
			}
			else {
				comments_text = comments_text + "<li class=\"comment_box\">" + comment_text + comment_delete + "</li>";			
			}
		}
		comments_text = comments_text + "</ul>";
	}
	$("#"+id).append("<p class=\"fw_para_comment_box\" style=\"width: 100%; margin: 0px;\"></p>");
	$("#"+id).children(".fw_para_comment_box").html(comments_text+"<hr class=\"fw_hr\" style=\"margin: 5px;\" /><span class=\"comment_closebutton\" onclick=\"fw_showcomment_undo('"+id+"')\">(close)</span>");
	var height = $("#"+id).children(".fw_para_comment_box").css("height");
	$("#"+id).children(".fw_para_comment_box").css("height","0px");
	$("#"+id).children(".fw_para_comment_box").animate({"height":height},150,function() {});
}



function fw_showcomment_undo(id) {
	$("#"+id).children(".fw_para_comment_box").animate({height:0},250,function() { 
		$(this).delay(250).remove();
	});
	$("#"+id).children(".num_comments").css("display","block");
	$("#"+id).attr("class","story_paragraph");
}

function fw_updatecomments() {
/*
	This will loop through every paragraph, check to see if it has comments attached to it, and if so append a box saying as much.
*/	
	var comment_text;
	var comment_para_id;
	var num_comments;
	$("#content").find(".story_paragraph").each(function(i,obj) {
		num_comments = 0;
		comment_text = "";
		comment_para_id = $(this).attr("id");
		if(fw_comments[comment_para_id]!=undefined) {
			num_comments = fw_comments[comment_para_id].length;
			$(this).children(".num_comments").html(fw_comments[comment_para_id].length);
			$(this).children(".num_comments").css("display","block");
		}
		if(num_comments>0) {
			$(this).children(".num_comments").html(num_comments);
			$(this).children(".num_comments").css("display","block");
		}
		else {
			$(this).children(".num_comments").css("display","none");
		}
	});
}

function fw_nudge_debug_console() {
	var nudge_debug_content = "<table>";
	for(var variable in fw_story_variables) {
		nudge_debug_content+="<tr><td>"+variable+"</td><td><input type=\"text\" id=\"debug_"+variable+"\" value=\""+fw_story_variables[variable]+"\"></input></td></tr>";
	}
	nudge_debug_content+="<tr><td colspan=\"2\"><span onclick=\"fw_nudge_debug_active()\">Update</span></td></tr></table>";
	$("#var_monitor").show();
	$("#var_monitor").html(nudge_debug_content);
}

function fw_nudge_debug_active() {
	for(var variable in fw_story_variables) {
		fw_story_variables[variable] = $("#debug_"+variable).val();
	}
	alert(fw_story_ids);
	fw_update_text_frames();
	fw_nudge_debug_console();
}

function fw_nudge(id,effect,element_id,nudge_class) {
	var nudge_action = effect.split(":");
	var nudge_modifier = nudge_action[1].substring(0,1);
	var nudge_value = nudge_action[1].substring(1);
	switch(nudge_modifier) {
		case("+"):
			fw_story_variables[nudge_action[0]] = parseInt(fw_story_variables[nudge_action[0]]) + parseInt(nudge_value); 
			break;
		case("-"):
			fw_story_variables[nudge_action[0]] = parseInt(fw_story_variables[nudge_action[0]]) - parseInt(nudge_value); 
			break;
		case("="):
			fw_story_variables[nudge_action[0]] = nudge_value;
	}
	var start_frame_index = fw_update_text_frames(id,true);
	if(nudge_class==="inline_choice" || nudge_class==="inline_default"){
		$("#"+element_id).hide();
		var append_id = "para_"+id+"_"+($("#"+fw_story_ids[start_frame_index-1]).find("div").length)/2;
		//alert(String(fw_story_ids[start_frame_index-1]).find("div")));
		$("#"+fw_story_ids[start_frame_index-1]).find("div").eq(0).append("<div class='story_paragraph' id='"+append_id+"' onclick=\"fw_comment(event,'"+append_id+"')\"><div class=\"num_comments\" onclick=\"fw_comments_show('"+append_id+"')\" style=\"display:none;\">0</div>"+$("#"+element_id).html()+"</div>");
		//$("#"+fw_story_ids[start_frame_index-1]).find("div").eq(0).append("<div class='story_paragraph' id='finished_"+id+"'>"onclick=\"fw_comment(event,'"+para_id+"')\"><div class=\"num_comments\" onclick=\"fw_comments_show('"+para_id+"')\" style=\"display:none;\">0</div>"+text_to_update+"</div>
		
		$("#finished_"+id).animate({backgroundColor:fw_fadein_highlight_color},150,function() { $(this).delay(150).animate({backgroundColor:paragraph_color},300)});
	}
	
	if(fw_show_missing==true) {
		fw_nudge_debug_console();
	}
	$("#nudge_"+id).delay(100).fadeOut(500);
	fw_fade_in_paras(start_frame_index,true);
	fw_comments_load();
}

function fw_do_text_frame_err(id) {
/*
For every given text frame, there must be a corresponding text that fills it. 
If there isn't, when "fw_show_missing" is not set to false, this will highlight every unmapped frame in red.
It also shows the current state of all story variables
*/
	if(fw_show_missing==true) {	
		var debug_text = "";
		for(var key in fw_story_variables) {
			debug_text += "<br />"+ key + ":" + fw_story_variables[key];
		}
		$("#"+id).html("<div style='width: 100%; background-color: red;'>"+id+debug_text+"</div>"); 
	}
}

function fw_update_text_frames(start_frame,nudged) {
/*
This function performs two checks:
1) It checks to make sure that the correct frames are being updated (i.e. that it is not updating any earlier frames)
2) It checks to make sure that it has selected the correct frame out of a number of possible ones
It then passes the appropriate content to fw_do_text_frame() to actually update the HTML.

For each frame, it checks to see whether appropriate section variant is the same as the current one. If it's not, it sets the appropriate status in the fw_story_section_variants_status_change array.

It RETURNS the index of the start frame, for convenience's sake
*/
	var start_frame_index;
	var debug_frame_index = 0;
	var current_block_unfilled;
	var debug_text;
	var destination_frame = "";
	var at_destination_block;
	if(start_frame===undefined) { start_frame_index = 0; }
	for(var i=0;i<fw_story_ids.length;i++) {
		if(parseInt(fw_story_ids[i]) === parseInt(start_frame)) {
			if(nudged==true) {
				start_frame_index = i+1;
			}
			else { start_frame_index = i; }
		}
		if(parseInt(fw_story_ids[i]) === parseInt(fw_debug_start)) {
			debug_frame_index = i;
		}
	}
	if(debug_frame_index>start_frame_index) {
		start_frame_index = debug_frame_index;
	}
	for(var j=start_frame_index;j<fw_story_ids.length;j++) {
		current_block_unfilled = true;
		$(fw_story_xml).find("section").each(function() {
			var fw_current_block_id = parseInt($(this).find("block").text());
			if(destination_frame=="") {
				at_destination_block = true;
			}
			else {
				//alert(destination_frame);
				if(destination_frame==fw_current_block_id) {
					//alert(fw_current_block_id);
					at_destination_block = true;
				}
				else {
					at_destination_block = false;
					if(current_block_unfilled===false) {
						//fw_do_text_frame(fw_current_block_id,"","","");
					}
				}
			}
			if(fw_current_block_id===parseInt(fw_story_ids[j]) && current_block_unfilled===true && at_destination_block===true) {
				fw_do_text_frame_err(fw_current_block_id);
				//alert(fw_current_block_id);
				var section_variant = $(this).find("variant").text();
				if(section_variant===undefined){
					section_variant = 1;
				}
				var requirements_string = $(this).find("requirements").text();
				if(requirements_string===undefined) {
					requirements_string = "";
				}
				var meets_requirements = fw_check_requirements(requirements_string);
				if(meets_requirements===true && current_block_unfilled===true) {
					if((fw_story_section_variants[fw_current_block_id]!=section_variant) || (fw_story_section_variants[fw_current_block_id]==undefined)) {
						fw_story_section_variants[fw_current_block_id] = section_variant;
						fw_story_section_variants_status_change[fw_current_block_id] = true;
					}
					else {
						fw_story_section_variants_status_change[fw_current_block_id] = false;
					}
					current_block_unfilled = false;
					if(fw_show_missing==true) {
						debug_text = "<span style=\"font-size: 70%; margin-left: 32px; background-color: yellow;\">Block "+fw_current_block_id+" var " + section_variant + " ("+$(this).find("requirements").text()+") dest: "+$(this).find("destination").text()+"</span>";
					}
					else {
						debug_text = "";
					}
					var destination_string = $(this).find("destination").text();
					if(destination_string==undefined) {
						destination_string = "";
					}
					destination_frame=destination_string;
					//alert(destination_frame);
					fw_do_text_frame(fw_current_block_id,$(this).find("content"),$(this).find("nudges"),debug_text);
				}
			}
		});
	}
	fw_updatecomments();
	return start_frame_index;
}

function fw_check_requirements(limit_string) {
/*
Takes as an argument the restriction strings stored in a given section.
The string will be converted into an array, based on the ";" character.
Acceptable variable types:
Numeric (var:>0,var:<10,var:==10,var:>=10,var:<=10)
Boolean (var:true,var:false)
Story variables should be set when the story is initialised.

Returns true if all restrictors passed
Returns false if one or more restrictor failed
*/
	var requirement_components = "";
	var requirement_type_check = "";
	var compare_value;
	if(limit_string.length>0) {
		var requirements = limit_string.split(";");
		var passed_all_checks = true;
		for(var i=0;i<requirements.length;i++) {
			requirement_components = requirements[i].split(":");
			try {
				requirement_type_check = requirement_components[1].replace(/[0-9]/g,"");
			}
			catch(e) {
				alert(limit_string);
			}
			switch(requirement_type_check) {
				case("gt"):
					compare_value = parseInt(requirement_components[1].substring(2));
					if(fw_story_variables[requirement_components[0]]>compare_value) {
						;
					}
					else { passed_all_checks = false; }
					break;
				case("ge"):
					compare_value = parseInt(requirement_components[1].substring(2));
					if(fw_story_variables[requirement_components[0]]>=compare_value) {
						;
					}
					else { passed_all_checks = false; }
					break;
				case("lt"):
					compare_value = parseInt(requirement_components[1].substring(2));
					if(fw_story_variables[requirement_components[0]]<compare_value) {
						;
					}
					else { passed_all_checks = false; }
					break;
				case("le"):
					compare_value = parseInt(requirement_components[1].substring(2));
					if(fw_story_variables[requirement_components[0]]<=compare_value) {
						;
					}
					else { passed_all_checks = false; }
					break;
				case("eq"):
					compare_value = parseInt(requirement_components[1].substring(2));
					if(fw_story_variables[requirement_components[0]]==compare_value) {
						;
					}
					else { passed_all_checks = false; }
					break;
				case("true"):
					if(fw_story_variables[requirement_components[0]]=="true") {
						;
					}
					else { passed_all_checks = false; }
					break;
				case("false"):
					if(fw_story_variables[requirement_components[0]]=="false") {
						;
					}
					else { passed_all_checks = false; }
					break;
				default:
					alert("nothing happened");
			}
		}
		if(passed_all_checks==true) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return true;
	}
}

function componentToHex(c) {
		c = parseInt(c);
    	var hex = c.toString(16);
    	return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


function fw_user_check_status() {
/*
This will check to see if the user is logged in by calling a PHP function that queries the user database.
The PHP API needs to return a json file indicating whether or not the user is logged in, as well as the user's level.
ulevel 0: not logged in
ulevel 1: normal user
ulevel 2: admin
*/
	if(fw_offline_mode==false) {
		var xmlHTTP = new XMLHttpRequest();
	
		xmlHTTP.onreadystatechange = function() {
			if(xmlHTTP.readyState == 4) {
				//$("#fw_c5connector").remove();
				var response = JSON.parse(xmlHTTP.responseText);
				if(response.loggedIn===true) {
					fw_logged_in_uname = response.username;
					if(response.ulevel===2) {
						fw_admin_logged_in = true;
					}
				}
				if(fw_print_version==false) {
					try {
						fw_comments_load();
					}
					catch(e) {
						alert(e);
					}
				}
			}
		};
		
		if($("#fw_c5connector").length==0) {
			try {
				xmlHTTP.open("GET",fw_api_path+"fw_user.php?mode=0");
				xmlHTTP.send(null);
			}
			catch (e) {
				window.alert(e)
				return;
			}
		}
		else {
			try {
					
				xmlHTTP.open("GET",fw_api_path+"fw_user.php?mode=1&uid="+$("#fw_c5connector").val());
				xmlHTTP.send(null);
			}
			catch (e) {
				window.alert(e)
				return;
			}
		}
	}
	else {
		fw_logged_in_uname = "rob";
		fw_admin_logged_in = true;
		fw_comments_load();
	}
	
	
	//var response = JSON.parse(xmlHTTP.responseText);

}

function fw_start(filename) {
/*
Start function. Loads the story from the XML file, and initializes the story skeleton.
Initializes all needed story variables also.
Story skeleton is initialized by creating a bare div for every unique story section ID.
*/
	var fw_story_args = filename.split("/");
	if(fw_story_args.length > 0) {
		fw_story_name = fw_story_args[fw_story_args.length-1];
	}
	else {
		fw_story_name = fw_story_args[0];	
	}
	fw_story_name = fw_story_name.substring(0,fw_story_name.length-4);
	var temp_ids_array = [];
	var i=0;
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});

	if(vars["offline"]!=undefined) {
		if(vars["offline"]=="true") {
			fw_offline_mode = true; // This disables calls to remote functions. Used for style testing.
		}
	}

	/*
	 * If the hint container (used for the hint controller) doesn't exist, then we need to create it. 
	 */
	if($("#fw_hint_container").length===0) {
		var hint_container = $("<div />",{"id":"fw_hint_container"});
		$("#story_wrapper").append(hint_container).ready(function() {
			$("#hint_textbox").appendTo($("#fw_hint_container"));
		});


	}

	
	var paragraph_string = $("#fw_default_para").css("background-color").toString();
	paragraph_string = paragraph_string.substring(4,paragraph_string.length-1);
	var paragraph_hex = paragraph_string.replace(" ","").split(",");
	
	paragraph_color = rgbToHex(paragraph_hex[0],paragraph_hex[1],paragraph_hex[2]);

	fw_load_story(filename);
	fw_user_check_status();
	
	
	$(fw_story_xml).find("variable").each(function() {
		fw_story_variables[$(this).find("name").text()] = $(this).find("value").text();
	});

	$(fw_story_xml).find("hint").each(function() {
		var color = $(this).find("color").text();
		if(color.length<3) {
			color = paragraph_color;
		}
		fw_hint_colors[$(this).find("id").text()] = color; // sets the background color of the hint.
		fw_hint_text[$(this).find("id").text()] = $(this).find("text").text();
		try {
			var spoiler = $(this).find("spoiler").text(); // Set by the simpleconvert preprocessor to "true" if the hint should be spoiler-marked
			var interlink = $(this).find("interlink").text(); // Set by the simpleconvert preprocessor to "true" if the hint contains an interlinked story
			if(spoiler=="true") {
				fw_hint_spoiler[$(this).find("id").text()] = true;
			}
			else {
				fw_hint_spoiler[$(this).find("id").text()] = false;
			}
			if(interlink=="true") {
				fw_hint_interlink[$(this).find("id").text()] = true;
			}
			else {
				fw_hint_interlink[$(this).find("id").text()] = false;
			}
		}
		catch(e) {
			fw_hint_spoiler[$(this).find("id").text()] = false;
			fw_hint_interlink[$(this).find("id").text()] = false;
			console.log(e);
		}
	});	
		
	$(fw_story_xml).find("block").each(function() {
		temp_ids_array.push(parseInt($(this).text()));
	});
	var temp_ids_dict = {};
	for(i=0;i<temp_ids_array.length;i++) {
		temp_ids_dict[temp_ids_array[i]]=0;
	}
	for(i in temp_ids_dict) {
		fw_story_ids.push(i);
	}
	for(i=0;i<fw_story_ids.length;i++) {
		var fw_story_div = $("<div id='"+fw_story_ids[i]+"' class='story_section'></div>");
//		var fw_story_div_content = document.createTextNode("");
//		fw_story_div.appendChild(fw_story_div_content);
		$("#content").append(fw_story_div);
	}
	
	if(vars["skip"]!=undefined) {
		fw_debug_start = vars["skip"];
	}
	if(vars["debug"]!=undefined) {
		if(vars["debug"]=="true") {
			fw_show_missing = true;
			fw_nudge_debug_console();
		}
	}	
	if(vars["print"]!=undefined) {
		if(vars["print"]=="true") {
			fw_print_version = true;
		}
	}
	if(vars["ctask"]==undefined) {
		/*
		* Special concrete5 block to move the story tags into the main body of the story.
		* This should also prevent FW from running when I'm trying to edit a page.
		*/
		fw_story_title = $(fw_story_xml).find("title").text();
		fw_story_author = $(fw_story_xml).find("author").text();
		document.title = fw_story_title + ": Fourth Wall v. " + fw_version_no;
		if($(".ccm-block-tags-wrapper").length>0) {
			var new_ccm_row = $("<div />",{"class":"row"});
			var new_ccm_col = $("<div />",{"class":"col-sm-12"});
			new_ccm_col.append($(".ccm-block-tags-wrapper")[0]);
			//$(".ccm-block-tags-wrapper")[0].appendTo(new_ccm_col); 
			new_ccm_row.append(new_ccm_col);
			var spacer_div = $("<div />",{"class":"fw_tag_spacer"});
			$("#story_wrapper").prepend(spacer_div);
			$("#story_wrapper").prepend(new_ccm_row);
		}
	
		$("#fw_title").html("&ldquo;"+fw_story_title+"&rdquo;");
		$("#fw_author").html("By "+fw_story_author);
		fw_update_text_frames();
	}
	
	
}