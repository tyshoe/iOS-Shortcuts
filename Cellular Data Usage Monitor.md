# Cellular Data Usage Monitor

### [Download](https://www.icloud.com/shortcuts/a48e3ba942e1495db16b8ecea4582cdf)

# Setup:
1. Click the download button and add the shortcut to your phone
2. Create a note in the Notes App with any Name you want (Cellular Data Usage) is preferred
3. If you decide to give your note a different Name, edit the text of the find note shortcut action

I have bracketed what you will need to change `Find All Notes where Name contains [Cellular Data Usage]`

# Usage:
Intended Use:

Monitor Cellular Data Usage by logging data usage over a period of time to get more detailed information about data usage over a user defined period of time rather than since last time the statistics have been reset

Common ways to run shortcut:
1. Clicking run shortcut
2. Siri
3. Automated Timer

To set an automated timer:

1. In the Shortcuts Application, navigate to the Automation Tab
2. Click the `+` Button at the top right of the screen
3. Create Personal Automation
4. Enter Information and click `next`
5. Click `+ Add Action` and search "Run Shortcut" without the quotation marks
6. Click `Shortcut` --> `Cellular Data` --> `Next` --> `Done`

# Improvements
1. Add Roaming Usage
2. Reset Statistics when shortcut runs
3. Usage Over Period = Usage Last Period - Usage This Period

# How it works
It works in 4 parts
1. Navigate to data usage and take screenshot - sets url to settings preference, open the url, and take a screenshot
2. Crop the screenshot, get text from the cropped screenshot and format a text box
3. Find a note in your notes that is named Cellular Data Usage
4. Add the text box to the end of your note
