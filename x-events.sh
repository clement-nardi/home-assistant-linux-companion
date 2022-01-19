#!/bin/bash

id=

while read -r x_event; do
    if echo $x_event | grep -q _NET_ACTIVE_WINDOW; then id=$(echo $x_event|grep -o '0[xX][a-zA-Z0-9]\+'); fi
    if [ "$id" = "0x0" ] ; then 
        >&2 echo "warning: the active window has id 0x0, which may mean you are using wayland instead of X11"
        app_name=""
    else
        prop=$(xprop -id $id WM_CLASS _NET_WM_STATE 2> /dev/null)
        app_name=$(echo $prop | sed -n 's/^WM_CLASS.* = "\(.*\)", "\(.*\)".*$/\1/p')
        if [ "$app_name" = "" ] ; then
            >&2 echo "warning: unable to get information on window with ID $id, was it just closed?"
        else 
            if echo $prop | grep -q FULLSCREEN; then 
                is_fullscreen=ON 
            else
                is_fullscreen=OFF
            fi

            echo "{\"is_fullscreen\":\"$is_fullscreen\", \"app\":\"$app_name\"}"
        fi
    fi
done < <(xprop -spy -root _NET_ACTIVE_WINDOW _NET_CLIENT_LIST_STACKING)