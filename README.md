**Daily Activity Logger**

This desktop application helps you automatically log your daily work activities. The app will pop up on your screen at a set time interval, prompt you to fill in your work details, and save the data to a CSV file.
***Key Features***

+ Automatic Pop-up: The application appears as a full-screen, on-top pop-up at a configurable interval.
+ Always On Top: The application window takes over the screen, ensuring you can immediately log your activity without any distractions.
+ Easy Configuration: All essential settings like your name, projects, tasks, and locations are stored in a single config.json file.
+ CSV Data Storage: Activities are automatically saved to a CSV file with a specific name format (month-timesheets.csv).

***How to Run the Application***

This app is built with Electron, so it requires Node.js and npm to run.

***Setup***

1. Make sure you have Node.js and npm installed.
2. Open your terminal or Command Prompt.
3. Navigate to your project directory.
4. Run the following command to install all the necessary dependencies:

```bash
npm install
```

***Running in Development Mode***

To run the application in development mode:
```basht
npm start
```

***Project Structure***

* main.js: The core application logic. It manages the app window, the pop-up scheduler, and the file-saving process.
* index.html: The user interface (UI). This is the pop-up where you enter your activity details.
* config.json: The configuration file. Here, you can customize all of the app's settings.
* preload.js & renderer.js: Inter-process communication. These files handle the secure communication between the UI and the core application logic.

***Configuration File (config.json) Explained***

This file is crucial as it contains all the data and settings you can adjust.
```json 
{
    "user": {
    "name": "Giri Rahayu"
},
"scheduler": {
    "interval_minutes": 30
},
"project_list": [
    {
        "name": "A.I. Wide Area Digital (WAD) Trunking Project - Fase 1 IDG",
        "tasks": [
            "Team Lead Middleware",
            "System Integration"
        ]
    }
],
"locations": [
    "Indy Bintaro Office - Building F",
    "Remote Location"
]
}
```

+ user: This object holds your name. It will be automatically included in every row of the CSV file.
+ scheduler: This object contains interval_minutes, which determines how often the pop-up will appear. You can change the value of 30 to any other duration (e.g., 60 for one hour).
+ project_list: This is an array of your projects. Each project has a name and an array of tasks that will appear in the pop-up's dropdown menu.
+ locations: This is an array containing a list of your work locations. This list will appear in the location dropdown.

***Creating an Installable File (Compilation)***

To create a distributable binary that doesn't require Node.js, you can use electron-builder.

***Compiling for Windows, MacOS & Linux***

Run the following command in your terminal:
```bash 
npm run dist
```
This command will create an installable file (.exe for Windows and .AppImage for Linux) inside the dist/ folder.

 is complete, the Daily-Activity-Logger-*.dmg file will be available inside the dist/ folder.