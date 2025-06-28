# Wi Chat

## How to run/debug

- [Install Flutter](https://flutter.dev/docs/get-started/install)
- Clone this repo
- Open the project folder in VS Code
- Connect device or launch emulator
- **Run** > **Start Debugging** or **Run Without Debugging**. If asked for Environment, choose "Dart & Flutter".

If you prefer a CLI, see [this article](https://medium.com/flutter-community/flutter-and-the-command-line-a-love-story-a3648ef2411).


# How to work with firebase side
- ./firebase contains all items needed for running functions and rules in Firebase
- FIRESTORE RULES:
  - firestore.rules contains rules definitions
  - deploy using command npm run deploy-rules

- FIREBASE FUNCTIONS:
  - src folder contains code for firebase functions
  - deploy functions: npm run build;  npm run deploy-functions