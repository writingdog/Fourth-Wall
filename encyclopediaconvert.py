# -*- coding: UTF-8 -*-

import io
import string
import re
import sys
from subprocess import call
notes = 0

to = "encyclopedia"

xmlout = open("{}.json".format(to),"w")

xmlout.write("entries = {\n")
 
call(["textutil","-convert","html","{}.rtf".format(to),"-output","{}.html".format(to)])

with open("{}.html".format(to)) as f:
	lines = f.readlines()

entryarr = []
inentry = False

for line in lines:
	startentry = False
	if(line[:2]=="<p"):
		line = string.replace(line,"\n","")
		line = string.replace(line,"\r","")
		line = string.replace(line,"</p>","")
		line = string.replace(line,"</span>","")
		line = string.replace(line,"<br>","")
		line = re.sub("<p class=\"?.*?\">","",line)
		line = re.sub("<span class=\"?.*?\">","",line)
		line = string.replace(line,"\"","&#038;quot;")
		line = string.replace(line,"“","&#038;ldquo;")
		line = string.replace(line,"”","&#038;rdquo;")
		line = string.replace(line,"‘","&#038;lsquo;")
		line = string.replace(line,"’","&#038;rsquo;")
		line = string.replace(line,"'","&#038;apos;")
		line = string.replace(line,"<","&lt;")
		line = string.replace(line,">","&gt;")
		if(inentry==False):
			if(len(line)!=0):
				inentry = True
				startentry = True
		if startentry==True:
			print(line)
			ldata = line.split("|")
			if(len(ldata)==3):
				ititle = ldata[2]
			else:
				ititle = string.replace(ldata[0]," ","")
				ititle = string.replace(ititle,"-","")
				ititle = ititle.lower()
			xmlout.write("\t{}:{{\n".format(ititle))
			xmlout.write("\t\t\"title\":\"{}\",\n".format(ldata[0]))
			xmlout.write("\t\t\"type\":\"{}\",\n".format(ldata[1]))
			startentry = False
		else:
			if(line[:5]=="Refs:"):
				inentry = False
				xmlout.write("\t\t\"paras\":[\n")
				for a in entryarr:
					xmlout.write("\t\t\t[{}],\n".format(a))
				xmlout.write("\t\t]\n\t},\n")
				entryarr = []
			else:
				if len(line) != 0:
					entryarr.append(line)

xmlout.write("}")

xmlout.close()