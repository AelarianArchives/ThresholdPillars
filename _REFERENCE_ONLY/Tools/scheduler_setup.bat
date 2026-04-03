@echo off
schtasks /create /tn "Threshold Backup" /tr "python C:\Users\sasir\Desktop\Aelarian\Archives\backup.py" /sc daily /st 23:11 /ru "%USERNAME%" /f
echo Task created successfully!
pause