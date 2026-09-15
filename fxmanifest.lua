fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

name 'feather-loadscreen'
author 'Feather Framework'
description 'A configurable loading screen for Feather Framework.'
version '0.1.1'

shared_script 'config.lua'
client_script 'client/main.lua'

files {
    'web/index.html',
    'web/config.js',
    'web/css/style.css',
    'web/js/script.js',
    'web/assets/images/*'
}

loadscreen 'web/index.html'
loadscreen_cursor 'yes'
loadscreen_manual_shutdown 'yes'
