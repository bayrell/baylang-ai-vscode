#!/bin/bash

SCRIPT_PATH=`dirname $0`
BASE_PATH=`dirname $SCRIPT_PATH`

case $1 in

    app)
        docker run -it --rm -v $BASE_PATH:/app \
            --user node node:22-slim \
            bash -c "cd /app && npm run build && npm run build_plugin"
    ;;
    
    npm)
        docker run -it --rm -v $BASE_PATH:/app \
            --user node node:22-slim npm ${@:2}
    ;;
    
    *)
        echo "$0 {app}"
    ;;
    
esac
