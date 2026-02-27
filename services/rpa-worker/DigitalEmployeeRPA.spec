# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['worker_main.py'],
    pathex=[],
    binaries=[],
    datas=[('C:\\Users\\Andy\\AppData\\Roaming\\Python\\Python312\\site-packages\\playwright\\driver', 'playwright/driver')],
    hiddenimports=['handlers.base_handler', 'handlers.media_handler', 'handlers.zhihu_handler', 'handlers.baike_handler', 'handlers.social_platform_handler', 'playwright'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['PyQt5', 'PySide6', 'tkinter', 'matplotlib', 'IPython', 'numpy', 'scipy', 'pandas'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='DigitalEmployeeRPA',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['..\\..\\apps\\web-console\\public\\favicon.ico'],
)
