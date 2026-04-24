@echo off
echo 正在下载 Python 便携版...
powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip' -OutFile 'python.zip'"
echo 解压...
powershell -Command "Expand-Archive -Path 'python.zip' -DestinationPath 'python' -Force"
del python.zip

echo 安装 pip...
powershell -Command "(Get-Content 'python\python311._pth') -replace '#import site', 'import site' | Set-Content 'python\python311._pth'"
powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'python\get-pip.py'"
python\python.exe python\get-pip.py

echo 安装依赖...
python\python.exe -m pip install --upgrade pip wheel setuptools
python\python.exe -m pip install pillow psd-tools pandas openpyxl "rembg[cpu]" "onnxruntime>=1.23.2,<2.0.0"

echo 验证包...
python\python.exe -c "import PIL; import psd_tools; import rembg; import onnxruntime; print('All packages OK')"

echo 完成！
pause