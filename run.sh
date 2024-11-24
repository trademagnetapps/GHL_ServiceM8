#!/bin/bash

# Function to handle commit and push
handle_commit() {
    git add .
    
    # Check if a commit message was provided
    if [ "$#" -eq 0 ]; then
        commit_message="update"
    else
        commit_message="$*"
    fi
    
    git commit -m "$commit_message"
    git push
    echo "Changes have been added, committed with message '$commit_message', and pushed."
}

# Function to start local frontend
handle_local() {
    cd frontend && npm run dev -- --open
}

# Function to start trigger.dev development
handle_dev() {
    cd workflow && npx trigger.dev@latest dev
}

# Function to deploy trigger.dev
handle_deploy() {
    cd workflow && npx trigger.dev@latest deploy
}

# Check if a command was provided
if [ "$#" -eq 0 ]; then
    echo "Usage: ./run [command] [options]"
    echo "Commands:"
    echo "  commit [message]  - Commit and push changes"
    echo "  local            - Start local frontend"
    echo "  dev              - Start trigger.dev development"
    echo "  deploy           - Deploy trigger.dev"
    exit 1
fi

# Parse commands
command="$1"
shift  # Remove the command from the arguments list

case "$command" in
    "commit")
        handle_commit "$@"
        ;;
    "local")
        handle_local
        ;;
    "dev")
        handle_dev
        ;;
    "deploy")
        handle_deploy
        ;;
    *)
        echo "Unknown command: $command"
        exit 1
        ;;
esac