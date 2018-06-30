#!/bin/bash

if [ $TRAVIS_BRANCH == 'master' ];
then 
    ncftp -u $user -p $pass $host << EOF         
        rm -rf /development/*
        quit
EOF
    
    ncftpput -R -v -u $user -p $pass $host /development dist/photils/*;     
fi