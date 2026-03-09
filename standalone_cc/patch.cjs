const fs = require('fs');
const path = 'c:/Users/xris_/Documents/GitHub/ToonCharacterAnimator/standalone_cc/src/components/ui/previews/PlayerPreview.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
    'orbitStateRef.current.target.copy(nextTarget);',
    'console.log(\"frameModel:\", { isFirstFrame, desiredDistance, minDistance, maxDistance, nextDistance, offsetLen: offset.length() });\n        orbitStateRef.current.target.copy(nextTarget);'
);
fs.writeFileSync(path, code);
