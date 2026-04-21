@echo off
echo 正在下载 Python 便携版...
powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.0/python-3.12.0-embed-amd64.zip' -OutFile 'python.zip'"
echo 解压...
powershell -Command "Expand-Archive -Path 'python.zip' -DestinationPath 'python' -Force"
del python.zip

echo 安装 pip...
powershell -Command "(Get-Content 'python\python312._pth') -replace '#import site', 'import site' | Set-Content 'python\python312._pth'"
powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'python\get-pip.py'"
python\python.exe python\get-pip.py

echo 安装 rembg...
python\python.exe -m pip install rembg --target python\site-packages

echo 完成！
echo 请重启应用程序
pause