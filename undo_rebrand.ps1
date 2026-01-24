
# Define the root directory
$rootDir = "c:\Users\luisa\OneDrive - MSFT\Desktop\proyectos en antigravity\cmcf-enterprise\src"

# Define replacements map
$replacements = @{
    "GYM" = "CMCF";
    "Professional Fitness Center" = "Centro Médico Científico Fitness";
    "brand-primary" = "brand-green";
    "bg-brand-primary" = "bg-brand-green";
    "text-brand-primary" = "text-brand-green";
    "border-brand-primary" = "border-brand-green";
    "shadow-\[0_0_15px_var\(--color-brand-primary\)\]" = "shadow-[0_0_15px_var(--color-brand-green)]";
    "var\(--color-brand-primary\)" = "var(--color-brand-green)"
}

# Get all files recursively
$files = Get-ChildItem -Path $rootDir -Recurse -Include *.tsx, *.ts, *.css, *.jsx, *.js

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
        $originalContent = $content
        $modified = $false

        foreach ($key in $replacements.Keys) {
            # Case-sensitive match for "GYM" is important to avoid replacing "GymService" or "GymConfig"
            # PowerShell -replace is case-insensitive by default, use [regex] with options if needed, 
            # but here "GYM" is upper case. "Gym" in GymService is mixed.
            # We will use explicit case sensitive regex for GYM.
            
            if ($key -eq "GYM") {
                 # \b ensures word boundary so we don't match inside words if it appeared there (unlikely for all caps GYM but good safety)
                 # But "GYM" might be part of "AGYM" ? Unlikely.
                 # Let's just use the exact string replacement but BE CAREFUL.
                 # Rebrand script used simple string replacement.
                 
                 # Using clike (Case-Sensitive Like) check logic?
                 # It's easier to use .NET Replace for case sensitive string replacement.
                 
                 if ($content.Contains($key)) {
                    $content = $content.Replace($key, $replacements[$key])
                    $modified = $true
                 }
            }
            else {
                # For others, standard replace is fine (variable names are unique enough)
                if ($content -match [regex]::Escape($key)) {
                    $content = $content -replace [regex]::Escape($key), $replacements[$key]
                    $modified = $true
                }
            }
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -Encoding utf8
            Write-Host "Updated: $($file.Name)"
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}
