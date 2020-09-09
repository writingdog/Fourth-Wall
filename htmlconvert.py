# -*- coding: UTF-8 -*-

import io
import string
import re
import sys
from subprocess import call
notes = 0


tn = "title of the story"
to = "name of the output file"
td = "date file was created"
tt = 0 # Whether this text also includes translations
ta = "Rob Baird"
tl = "Adult."
ts = "INSERT SUMMARY HERE."
te = "INSERT EXTENDED SUMMARY HERE" # extended summary (2/s)
#td = "July 6th, 2015"
tv = "<variables />\n"
tstring = ""
inline = False # Does this story have comments inline or not?

for arg in sys.argv:
	asubs = arg.split("=")
	if asubs[0] == "--name":
		to = asubs[1]
		print(to)
	elif asubs[0] == "--adult":
		if asubs[1] == "0":
			tl = "Clean."
		elif asubs[1] == "1":
			tl = "Adult."
		elif asubs[1] == "2":
			tl = "Adult; content warnings apply."
		elif asubs[1] == "3":
			tl = "Adult (optionally, includes clean variant)."
		else:
			tl = "Ault."
	elif asubs[0] == "--summary":
		ts = asubs[1]
	elif asubs[0] == "--extended":
		te = asubs[1]
	elif asubs[0] == "--title":
		tn = asubs[1]
	elif asubs[0] == "--date":
		td = asubs[1]
	elif asubs[0] == "--translate":
		tt = "1"
		tstring = ", inline translations,"
	elif asubs[0] == "--inline":
		inline = True
	elif asubs[0] == "--variables":
		svars = asubs[1].split(" ")
		tv = "<variables>\n"
		for svar in svars:
			svcomps = svar.split("|")
			tv = tv + "\t\t\t<variable>\n\t\t\t\t<name>{}</name>\n\t\t\t\t<value>{}</value>\n\t\t\t</variable>\n".format(svcomps[0],svcomps[1])
		tv = tv + "\t\t</variables>\n"

hintboiler = [
	"When you see this color, you can click on the text to learn more about a reference in the story or an explanation of a term. Click again to dismiss!",
	"When you see this color, you can click to see which story this refers to.",
	"When you see this color, you can click on the text to see my thoughts as the author of the story, or additional commentary on why I wrote it the way I did. &lt;i&gt;Please note that this might involve spoilers!&lt;/i&gt; If so, the hint border will be a dashed red line instead of a dotted line. Click again to dismiss!",
	"When you see this color, you can click on the text to see what it means. Click again to dismiss!"
]
hintcolor = ["#A9E2F3","#8bcc9d","#F5DA81","#F5ECCE"]

if tt=="1":
	intro = "&lt;i&gt;While reading this story, you will occasionally see highlighted text that you can click on. There are four kinds here: [[explanatory notes]], [[story interlinks]], [[behind the scenes commentary]], and [[translations]]. I hope that this is helpful to you in getting the most out of this story :) Enjoy!&lt;/i&gt;"
else:
	intro = "&lt;i&gt;While reading this story, you will occasionally see highlighted text that you can click on. There are three kinds here: [[worldbuilding notes]], [[story interlinks]] and [[behind the scenes commentary]]. I hope that this is helpful to you in getting the most out of this story :) Enjoy!&lt;/i&gt;"

xmlout = open("{}.xml".format(to),"w")
htmlout = open("{}_processed.html".format(to),"w")
txtout = open("{}_fa.txt".format(to),"w")

htmlout.write("<p>&lt;p style=\"font-size:2pt;\"&gt;</p><p>&lt;em&gt;{}&lt;/em&gt;</p><p>&lt;/p&gt;</p><p>&lt;p style=\"font-size:10px;\"&gt;</p><p>	&lt;em&gt;{} &lt;a href=\"https://www.patreon.com/writingdog\"&gt;Patreon subscribers&lt;/a&gt;, this should also be live for you with notes and maps and stuff.&lt;/em&gt;&lt;/p&gt;</p><p>&lt;p style=\"font-size:10px;\"&gt;</p><p>	&lt;em&gt;Released under the Creative Commons BY-NC-SA license. Share, modify, and redistribute--as long as it's attributed and noncommercial, anything goes.</p><p>	&lt;/em&gt;</p><p>&lt;/p&gt;</p><p>&lt;p&gt;</p><p>	---</p><p>&lt;/p&gt;</p><p>&lt;p&gt;</p><p>	&lt;em&gt;{}&lt;/em&gt;, by &lt;strong&gt;Rob Baird&lt;/strong&gt;</p><p>&lt;/p&gt;</p>\n".format(ts,te,tn))

txtout.write("[i]{}[/i]\n\n[i]{}. [url=\"https://www.patreon.com/writingdog\"]Patreon subscribers[/url], this should also be live for you with notes and maps and stuff.[/i]\n\n[i]Released under the Creative Commons BY-NC-SA license. Share, modify, and redistribute--as long as it's attributed and noncommercial, anything goes.[/i]\n\n".format(ts,te))

xmlout.write("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n<content>\n\t<metadata>\n\t\t<title>{}</title>\n\t\t<date>{}</date>\n\t\t<author>{}</author>\n\t\t<table></table>\n\t\t<style>\n\t\t\t<paragraph_color>#E7E7C8</paragraph_color>\n\t\t</style>\n\t\t{}\t\t<hints>\n".format(tn,td,ta,tv))

def numnotes():
	global notes
	notes = notes + 1
	return notes
 
#call(["textutil","-convert","html","{}.rtf".format(to),"-output","{}.html".format(to)])

with open("{}.html".format(to)) as f:
	lines = f.readlines()
comments = 1
done_with_comments = False
lastnotes = {}
prev_section = "100"
current_section = "100"

# preprocess section

for i in range(0,int(tt)+3):
	xmlout.write("\t\t\t<hint>\n\t\t\t\t<id>{}</id>\n".format(comments))
	xmlout.write("\t\t\t\t<color>{}</color>\n".format(hintcolor[i]))
	xmlout.write("\t\t\t\t<text>{}</text>\n\t\t\t</hint>\n".format(hintboiler[i]))
	comments = comments+1

c_arr = [] # Comments array
t_arr = [] # Story text array

pca = lines[12][6:8] # Check to try to decide what style is main text and which is comment
pcb = lines[13][6:8] # Second style declaration should be the one used for footnotes...

for line in lines:
	if(line[10:12]==pca):
		line = re.sub("<a id=\"commentlink[0-9]+\"><\/a><a href=\"#comment[0-9]+\">","[[",line)
		line = re.sub("<a id=\"commentlink[0-9]+\"><\/a><\/i><a href=\"#comment[0-9]+\">","</i>[[",line)
		line = re.sub("</a>","]]",line)
		t_arr.append(line)
	elif(line[10:12]==pcb):
		line = re.sub("<a id=\"comment[0-9]+\"><\/a><a href=\"#commentlink[0-9]+\">.*<\/a><i>: ","<i>",line)
		line = re.sub("<a id=\"comment[0-9]+\"><\/a><a href=\"#commentlink[0-9]+\">.*<\/a>: ","",line)
		line = re.sub("<img src=\"Images.*alt=\"Image\">","",line) # Removing any images included as inline on the export
		c_arr.append(line)

lines = []

for c in c_arr:
	lines.append(c)
lines.append("<p class=\"{}\">ECB</p>".format(pcb))
for t in t_arr:
	lines.append(t)

#print(lines)

for line in lines:
	if(line[:2]=="<p"):
		line = string.replace(line,"\n","")
		line = string.replace(line,"\r","")
		line = string.replace(line,"</p>","")
		line = string.replace(line,"</span>","")
		line = string.replace(line,"<br>","")
		line = re.sub("<p class=\"?.*?\">","",line)
		line = re.sub("<span class=\"?.*?\">","",line)
		unconvert = line
		line = string.replace(line,"\"","&#038;quot;")
		line = string.replace(line,"“","&#038;ldquo;")
		line = string.replace(line,"”","&#038;rdquo;")
		line = string.replace(line,"‘","&#038;lsquo;")
		line = string.replace(line,"’","&#038;rsquo;")
		line = string.replace(line,"'","&#038;apos;")
		line = string.replace(line,"<","&lt;")
		line = string.replace(line,">","&gt;")
		if(line=="ECB"):
			done_with_comments = True
			xmlout.write("\t\t</hints>\n\t</metadata>\n\t<comments />\n\t<textsections>\n\t\t<section>\n\t\t\t<block>100</block>\n\t\t\t<variant>1</variant>\n\t\t\t<default>true</default>\n\t\t\t<destination>200</destination>\n\t\t\t<requirements />\n\t\t\t<content>")
			line = re.sub(r"(]])",lambda m : "|{}{}".format(numnotes(),m.group(1)),intro);
			xmlout.write(line+"\n")
		else:
			if done_with_comments == False:
				line = re.sub(".*\/a&gt;: ","",line)
				line = re.sub("&lt;a href=&#038;quot;","&lt;a href=\"",line) # Trying to catch a specific problem with hyperlinks
				line = re.sub("&#038;quot;&gt;","\"&gt;",line) # Trying to catch a specific problem with hyperlinks
				
				ldata = line.split("|")
				if len(ldata) == 1:
					# This is a special check for if the comment doesn't have a class associated with it.
					ldata = ["#A9E2F3",line]
				if ldata[0]=="N" or ldata[0]=="NI":
					lcolor = "#A9E2F3"
				elif ldata[0]=="C" or ldata[0]=="CI":
					lcolor = "#F5DA81"
				elif ldata[0]=="T":
					lcolor = "#F5ECCE"
				elif ldata[0]=="I":
					lcolor = "#8bcc9d"
					ldata[1] = "+{}+".format(ldata[1])
				elif ldata[0]=="S" or ldata[0]=="SI":
					lcolor = "#F5DA81"
				else:
					lcolor = ldata[0]
				xmlout.write("\t\t\t<hint>\n\t\t\t\t<id>{}</id>\n".format(comments))
				xmlout.write("\t\t\t\t<color>{}</color>\n".format(lcolor))
				if ldata[0]=="S" or ldata[0]=="SI":
					xmlout.write("\t\t\t\t<spoiler>true</spoiler>\n")
				if ldata[0]=="I" or ldata[0]=="NI" or ldata[0]=="CI" or ldata[0]=="SI":
					xmlout.write("\t\t\t\t<interlink>true</interlink>\n")
				xmlout.write("\t\t\t\t<text>{}</text>\n\t\t\t</hint>\n".format(ldata[1]))
				#output_file.write(line+"\n")
				comments = comments + 1
			else:
				if line[:3] == "EVB":
					# This means we need to end the previous content section and start a new one.
					nudges = line.split("|")
					xmlout.write("\t\t\t</content>\n")
					#if current_section in lastnotes:
						# This implies that we've completed at least one iteration through a variant of this section.
						# So we need to reset the notes counter
						#if notes > lastnotes[current_section]:
						# The goal should be that if there are 50 notes going into section 3, and variant A has 2 notes and variant B has 5 notes
						# Section 4 should still start with note numbering 55
							#lastnotes[current_section] = notes
						#else:
							#notes = lastnotes[prev_section]
					#else:
						# This just ensures that if there are v... oh, god. No, I'm fucked, nevermind.
						# This means the current section is NOT in the last notes, which means it's the first time we've run through this loop
						#lastnotes[current_section] = notes
						# And we now need to 
						
					if len(nudges) > 1:
						xmlout.write("\t\t\t<nudges>\n\t\t\t\t<nudge>\n\t\t\t\t\t<inline>false</inline>\n")
						xmlout.write("\t\t\t\t\t<text>{}</text>\n\t\t\t\t\t<effect>{}</effect>\n\t\t\t\t</nudge>\n\t\t\t</nudges>\n\t\t</section>\n".format(nudges[2],nudges[3]))
					else:
						xmlout.write("\t\t\t<nudges />\n\t\t</section>\n")
				elif line[:3] == "SVB":
					# this means we need to actually initialize the next variant block
					sdata = line.split("|")
					xmlout.write("\t\t<section>\n\t\t\t<block>{}</block>\n\t\t\t<variant>{}</variant>\n".format(sdata[1],sdata[3]))
					if(sdata[4]=="1"):
						xmlout.write("\t\t\t<default>true</default>\n")
					else:
						xmlout.write("\t\t\t<default>false</default>\n")
					current_section = sdata[1]
					xmlout.write("\t\t\t<destination>{}</destination>\n".format(sdata[2]))
					if len(sdata)>5:
						xmlout.write("\t\t\t<requirements>{}</requirements>\n\t\t\t<content>\n".format(sdata[5]))
					else:
						xmlout.write("\t\t\t<requirements />\n\t\t\t<content>\n")
				else:
					line_xml = re.sub(r"(]])",lambda m : "|{}{}".format(numnotes(),m.group(1)),line);
					line_html = string.replace(line,"]]","")
					line_html = string.replace(line_html,"[[","")
					line_txt = string.replace(unconvert,"]]","")
					line_txt = string.replace(line_txt,"[[","")
					line_txt = string.replace(line_txt,"<em>","[i]")
					line_txt = string.replace(line_txt,"</em>","[/i]")
					line_txt = string.replace(line_txt,"</i>","[/i]")
					line_txt = string.replace(line_txt,"<i>","[i]")
					line_txt = string.replace(line_txt,"<strong>","[b]")
					line_txt = string.replace(line_txt,"</strong>","[/b]")
					line_txt = string.replace(line_txt,"<b>","[b]")
					line_txt = string.replace(line_txt,"</b>","[/b]")
					line_txt = string.replace(line_txt,"<","[")
					line_txt = string.replace(line_txt,">","]")
					xmlout.write(line_xml+"\n")
					if(line_html!="" and line_txt!=""):
						htmlout.write("<p>&lt;p&gt;{}&lt;/p&gt;</p>\n".format(line_html))
						txtout.write("{}\n\n".format(line_txt))
#print(lastnotes)
print("{} {} First posted {}. Includes notes{} and commentary.".format(ts,tl,td,tstring))
xmlout.write("\t\t\t</content>\n\t\t\t<nudges />\n\t\t</section>\n\t</textsections>\n</content>")

xmlout.close()
htmlout.close()
txtout.close()