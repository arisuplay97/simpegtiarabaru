Add-Type -AssemblyName System.Drawing

$inPathL = "C:\Users\ASUS\Videos\simpegtiarabaru-main\simpegtiarabaru-main\public\pojokkiri logo.png"
$imgL = [System.Drawing.Image]::FromFile($inPathL)
$bmpL = new-object System.Drawing.Bitmap($imgL)
$imgL.Dispose()
$bgColorL = $bmpL.GetPixel(0,0)
$bmpL.MakeTransparent($bgColorL)
$bmpL.Save($inPathL, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpL.Dispose()

$inPathR = "C:\Users\ASUS\Videos\simpegtiarabaru-main\simpegtiarabaru-main\public\pojokkanan logo.png"
$imgR = [System.Drawing.Image]::FromFile($inPathR)
$bmpR = new-object System.Drawing.Bitmap($imgR)
$imgR.Dispose()
$bgColorR = $bmpR.GetPixel(0,0)
$bmpR.MakeTransparent($bgColorR)
$bmpR.Save($inPathR, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpR.Dispose()

Write-Host "Success processing images"
