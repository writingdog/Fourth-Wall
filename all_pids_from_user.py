#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import re
import time
import os
import sqlite3
import string
import random
from bs4 import BeautifulSoup
import requests
import json
import sys

user_id = -1
sf_username = ""
sf_password = ""
session_requests = requests.session()
s_head = {
    "User-Agent":"Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16",
    "referrer":"https://www.sofurry.com"
}
user_stories = {}

def get_folders(uid):
    # Given a user ID, download a list of their folders.
    global session_requests
    
    f_list = [] # Will be an array of integer folder IDs
    data = ""

    # First step is to try and pull the HTML itself.
    url = "https://api2.sofurry.com/browse/user/stories?uid={}".format(uid)
    result = session_requests.get(url,headers=dict(referrer=url))
    if result.status_code == 200:
        print("Main user story page successfully identified")
        data = result.content

#    with open("./u{}.html".format(uid)) as f:
#        data = f.read()
    soup = BeautifulSoup(data,"html.parser")
    folders = soup.select(".sfFolderItem")
    for f in folders:
        # We don't use sfTextMedium because if the user has no folders, this class is just used for stories.
        # But that does mean that we need to get the folder img tag's parent
        f_href = f.parent["href"].split("folder=")[1]
        f_title = f.parent["title"]
        f_list.append([int(f_href),f_title])
    return f_list

def get_stories(uid,fid=False):
    # Get a list of story UIDs from a user or folder
    # We do not KNOW how many stories a user might have, but the API only returns 30 at a time
    global session_requests
    global user_stories

    s_list = [] # Array of submissions
    page_idx = 1
    finished = False

    while finished == False:
        if fid == False:
            # So we'll get the list of the main user page, not the folder API
            url = "https://api2.sofurry.com/browse/user/stories?uid={}&format=json&stories-page={}".format(uid,page_idx)
        else:
            url = "https://api2.sofurry.com/browse/folder/stories?by={}&folder={}&stories-page={}&format=json".format(uid,fid,page_idx)
        result = session_requests.get(url,headers=dict(referrer=url))
        if result.status_code == 200:
            json_data = json.loads(result.content)
            stories = json_data["items"]
            print(url)
            if len(stories) < 30:
                # If the result has fewer than 30 stories, we don't need to try incrementing stories-page 
                finished = True
            for s in stories:
                s_id = int(s["id"])
                s_title = s["title"]
                if s_id in user_stories:
                    finished = True
                else:
                    user_stories[s_id] = s_title
                    s_list.append([s_id,s_title])
        else:
            finished = True
        page_idx = page_idx + 1
    return s_list

def login():
    global session_requests
    global s_head
    global sf_username
    global sf_password

    payload = {'LoginForm[sfLoginUsername]':'{}'.format(sf_username), 'LoginForm[sfLoginPassword]':'{}'.format(sf_password),"returnURL":"/","yt1":"Login","YII_CSRF_TOKEN":""}
    url = "https://www.sofurry.com"
    result = session_requests.get(url)
    print(result.status_code)
    url = "https://www.sofurry.com/user/login"
    print("Attempting login...")
    result = session_requests.post(url,data = payload, headers = s_head)
    #open("./content/{}.html".format("login"),"wb").write(result.content)
    return(int(result.status_code))

if len(sys.argv)>1:
    # Populate parameters from the arguments passed to us.
    v = sys.argv[1] # mode
    for a in sys.argv:
        arg_subs = a.split("=")
        arg = ""
        val = ""
        if len(arg_subs) == 2:
            arg = arg_subs[0]
            value = arg_subs[1].strip()
        if arg == "u" or arg == "user" or arg == "uid":
            user_id = int(value)
        elif arg == "login" or arg == "l":
            sf_username = value
        elif arg == "password" or arg == "pass" or arg == "p":
            sf_password = value

if user_id != -1 and sf_username != "" and sf_password != "":
    # So a user ID has been given, as well as a username and password.
    l = login()
    all_stories = []
    all_titles = []
    if l == 200:
        # So we have successfully logged in. First get all stories NOT in folders.
        stories = get_stories(user_id) # result is an array of submission UIDs
        print("Retrieved {} stories in root folder.".format(len(stories)))
        for s in stories:
            all_stories.append(s[0])
            all_titles.append(s[1])
        
        # Now, get a list of folders
        folders = get_folders(user_id)
        print("Retrieved {} folders.".format(len(folders)))
        for f in folders:
            # For each folder, get the list of stories in that folder.
            stories = get_stories(user_id,f[0])
            print("Retrieved {} stories in subfolder {} ({}).".format(len(stories),f[0],f[1]))
            for s in stories:
                all_stories.append(s[0])
                all_titles.append(s[1])
for i in range(0,len(all_stories)):
    print("{}\t{}".format(all_stories[i],all_titles[i]))

print(len(user_stories))