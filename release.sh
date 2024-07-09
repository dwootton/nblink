#!/bin/bash

# Check if TWINE_USERNAME and TWINE_PASSWORD are set
if [ -z "$TWINE_USERNAME" ] || [ -z "$TWINE_PASSWORD" ]; then
    echo "Error: TWINE_USERNAME and TWINE_PASSWORD must be set in the environment."
    echo "You can set them like this:"
    echo "export TWINE_USERNAME=__token__"
    echo "export TWINE_PASSWORD=your_pypi_token_here"
    exit 1
fi

# Bump version
echo "Bumping version..."
NEW_VERSION=$(hatch version patch)
echo "New version: $NEW_VERSION"

# Clean and rebuild
echo "Cleaning and rebuilding..."
jlpm clean:all
rm -rf ./dist
python -m build

# Upload to PyPI
echo "Uploading to PyPI..."
twine upload dist/* --non-interactive

echo "Release $NEW_VERSION completed!"