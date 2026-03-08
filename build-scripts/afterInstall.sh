#!/bin/bash
# Post-install script: replace the /usr/bin/petmate symlink with a wrapper
# that passes --no-sandbox to Electron (required on systems where the Chrome
# sandbox setuid binary is not configured).

set -euo pipefail

WRAPPER=/usr/bin/petmate
BINARY=/opt/Petmate/petmate

# Remove the symlink (or existing file) created by the deb package
rm -f "$WRAPPER"

# Write a small wrapper script in its place
cat > "$WRAPPER" <<'EOF'
#!/bin/sh
exec /opt/Petmate/petmate --no-sandbox "$@"
EOF

chmod 755 "$WRAPPER"
