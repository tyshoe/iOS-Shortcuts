# Cellular Data Usage Monitor  

<font size="5">   📥 
**[Download Shortcut](https://www.icloud.com/shortcuts/a7f55785d1cd41f38910aee7ec41df00)**  
</font>


## **Setup**  
1. Click the download button and add the shortcut to your phone.  
2. *(Optional)* To customize the note name, edit the shortcut and modify the first **Text** action.  

### **Compatibility**  
This shortcut has only been tested on iPhone 11, iOS Version 18.5.

## **Usage**  
**Intended Use:**  
Monitor cellular data usage by logging consumption over a user-defined period, providing more detailed insights than the default system statistics.  

**How to Run the Shortcut** *(via [Apple Shortcuts Guide](https://support.apple.com/guide/shortcuts/welcome/ios)):*  
- Shortcuts app  
- Siri  
- Automation  
- Control Center  
- Home Screen  

### **Automating Data Logging** *(via [Apple Automation Guide](https://support.apple.com/guide/shortcuts/create-a-new-personal-automation-apdfbdbd7123/ios)):*  
1. Open the **Shortcuts** app → **Automation** tab.  
2. Tap **+** (top-right) → **Create Personal Automation**.  
3. Set your trigger (e.g., time-based) → **Next**.  
4. Tap **Add Action** → Search for *"Run Shortcut"*.  
5. Select **Log Cellular Data Usage** → **Next** → **Done**.  

---

## **Planned Improvements**  
[ ] Add roaming usage tracking.  
[ ] Include top apps’ data consumption.  
[ ] Auto-reset statistics on each run.  
[ ] Calculate: *Usage over period = Current usage - Last logged usage*.  

---

## **How It Works**  
1. **Create note file**
   - Checks if note for logging exists
   - Creates note with user defined title
2. **Capture Data Usage**  
   - Opens *Settings* → Cellular → Cellular Data Usage page.  
   - Takes a screenshot.  
3. **Process Screenshot**  
   - Crops the image.  
   - Extracts text and formats it into a log entry.  
4. **Save Data**  
   - Locates note named *"Cellular Data Usage"*.  
   - Appends the new log entry to the note.  

## **Example Note**
**Cellular Data Usage**<br>
5 GB - Jan 1, 2025 at 6:00AM<br>
10 GB - Feb 1, 2025 at 6:00AM<br>
15 GB - Mar 1, 2025 at 6:00AM<br>

