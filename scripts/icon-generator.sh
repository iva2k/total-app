#!/usr/bin/env bash

# Determine if we're sourced or executed
( return 0 2>/dev/null ) && { is_sourced=1; script=$(basename "${BASH_SOURCE[0]}"); } || { is_sourced=0; script=$(basename "$0"); }

# Determine script directory
myreadlink() { [ ! -h "$1" ] && echo "$1" || (local d l; d="$(dirname -- "$1")"; l="$(expr "$(command ls -ld -- "$1")" : '.* -> \(.*\)$')"; cd -P -- "$d" || exit; myreadlink "$l" | sed "s|^\([^/].*\)\$|$d/\1|"); }
#parent="$(cd -P -- "$(dirname    "$(greadlink -f "${BASH_SOURCE[0]}" || readlink -f "${BASH_SOURCE[0]}" || readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" &> /dev/null && pwd)"
parent="$(dirname -- "$(myreadlink "${BASH_SOURCE[0]}")" )"
parent=$(cd "$parent"; pwd)  ;## resolve absolute path
parent=${parent%/}  ;## trim trailing slash

SOURCE="${parent}"
BASE=$(dirname "${SOURCE}")
#echo "DEBUG BASE=${BASE}"
#echo "DEBUG BASH_SOURCE=${BASH_SOURCE[*]}, script=$script, parent=$parent, is_sourced=$is_sourced, user=$INST_USER"

# Constants
OUTPUT_DIR="${BASE}/static"
# echo "DEBUG: OUTPUT_DIR=\"${OUTPUT_DIR}\""

# Few Level Heading Separators for Nice Log (carriage return at the end allows
#  echo "${SEP2}SOME HEADER " to print ---> "SOME HEADER ###########")
SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

# Check and Decode args

if [ $# -eq 0 ]; then
    echo "Usage: $0 input_favicon.svg [input_app_icon.svg [input_app_icon_bg.svg [input_app_icon_texture.svg]]] "
    exit 1;
fi
if [ ! -r "$1" ]; then
    echo "Error, cannot read input_favicon file \"$1\"." 
    exit 1;
fi
FAVICON_SRC="$1"

if [ $# -gt 1 ]; then
    if [ ! -r "$2" ]; then
        echo "Error, cannot read input_app_icon file \"$2\"." 
        exit 1;
    fi
    APPICON_SRC="$2"
else
    APPICON_SRC="$1"
fi

if [ $# -gt 2 ]; then
    if [ ! -r "$3" ]; then
        echo "Error, cannot read input_app_icon_bg file \"$3\"." 
        exit 1;
    fi
    APPICON_SRC_BG="$3"
else
    APPICON_SRC_BG="${APPICON_SRC}"
fi

if [ $# -gt 3 ]; then
    if [ ! -r "$4" ]; then
        echo "Error, cannot read input_app_icon_texture file \"$4\"." 
        exit 1;
    fi
    APPICON_SRC_TXR="$4"
else
    APPICON_SRC_TXR="${APPICON_SRC_BG}"
fi

# Find All Programs
echo "${SEP1}FINDING PROGRAMS "

# # Scour
# SCOUR="$(which scour 2>/dev/null)"
# if [ ! -x "${SCOUR}" ]; then
#     SCOUR="C:/Program Files/..."
# fi
# if [ ! -x "${SCOUR}" ]; then
#     echo "Error: Cannot find Scour. Visit <https://github.com/scour-project/scour> to install. Run 'pip install scour' (need Python 3). Did you enable python environment?"
#     exit 1;
# fi
# echo "  Scour    : ${SCOUR}"

# SVGO
SVGO="$(which svgo 2>/dev/null)"
if [ ! -x "${SVGO}" ]; then
    SVGO="./node_modules/.bin/svgo"
fi
if [ ! -x "${SVGO}" ]; then
    echo "Error: Cannot find SVGO. Visit <https://www.npmjs.com/package/svgo> to install. Run 'pnpm install -g svgo'. Did you run 'pnpm i'?"
    exit 1;
fi
echo "  SVGO    : ${SVGO}"

# Inkscape
INKSCAPE="$(which inkscape 2>/dev/null)"
if [ ! -x "${INKSCAPE}" ]; then
    INKSCAPE="$(which inkscape.exe  2>/dev/null)"
fi
if [ ! -x "${INKSCAPE}" ]; then
    INKSCAPE="C:/Program Files/Inkscape/bin/inkscape.exe"
fi
if [ ! -x "${INKSCAPE}" ]; then
    echo "Error: Cannot find Inkscape. Visit <https://inkscape.org> to install."
    exit 1;
fi
echo "  Inkscape : ${INKSCAPE}"

# OptiPNG
OPTIPNG="$(which optipng 2>/dev/null)"
if [ ! -x "${OPTIPNG}" ]; then
    OPTIPNG="$(which optipng.exe 2>/dev/null)"
fi
if [ ! -x "${OPTIPNG}" ]; then
    OPTIPNG="C:/Program Files (x86)/optipng/optipng.exe"
fi
if [ ! -x "${OPTIPNG}" ]; then
    echo "Error: Cannot find OptiPNG. Visit <https://optipng.sourceforge.net> to install."
    exit 1;
fi
echo "  OptiPNG  : ${OPTIPNG}"

# # convert from ImageMagic pre v7
# CONVERT="$(which convert 2>/dev/null)"
# if [ ! -x "${CONVERT}" ]; then
#     CONVERT="$(which convert.exe 2>/dev/null)"
# fi
# if [ ! -x "${CONVERT}" ]; then
#     CONVERT="C:/Program Files (x86)/convert/convert.exe"
# fi
# if [ ! -x "${CONVERT}" ]; then
#     echo "Error: Cannot find convert from ImageMagick. Visit <https://imagemagick.org> to install."
#     exit 1;
# fi
# echo "  convert  : ${CONVERT}"

# convert is replaced by magick-convert from ImageMagic v7
CONVERT="$(which magick 2>/dev/null)"
if [ ! -x "${CONVERT}" ]; then
    CONVERT="$(which magick.exe 2>/dev/null)"
fi
if [ ! -x "${CONVERT}" ]; then
    CONVERT="C:/Program Files/ImageMagick-7.1.0-Q16/magick.exe"
fi
if [ ! -x "${CONVERT}" ]; then
    echo "Error: Cannot find magick from ImageMagick. Visit <https://imagemagick.org> to install."
    exit 1;
fi
echo "  magick   : ${CONVERT}"

echo

# Create output directory
if [ ! -d "${OUTPUT_DIR}" ]; then
    echo "${SEP1}CREATE OUTPUT DIRECTORY "
    if mkdir -p "${OUTPUT_DIR}" 2>/dev/null ; then
        echo "Created ${OUTPUT_DIR}"
    fi
    echo
fi
created=()

function generatePng () {
    local INFILE=$1
    local OUTFILE=$2
    local SIZE=$3
    local TMPFILE="${SOURCE}/__tmp.png"
    rm "${TMPFILE}" >/dev/null 2>&1
    echo "${SEP2}GENERATING PNG: "
    echo "\"${INFILE}\" -> size(${SIZE}x${SIZE}) -> \"${OUTFILE}\"... "
    [ -f "${OUTFILE}" ] && rm "${OUTFILE}"
    [ -f "${TMPFILE}" ] && rm "${TMPFILE}"
    # generate PNGs => optimise PNGs => clean up temporary files
    "${INKSCAPE}" -h  "$SIZE" "$INFILE" --export-filename "${TMPFILE}"
    "${OPTIPNG}" -o7 -out "${OUTFILE}" "${TMPFILE}"
    rm "${TMPFILE}" >/dev/null 2>&1
    [ ! -r "${OUTFILE}" ] && echo "Error, result file ${OUTFILE} not found" && exit 1;
    created+=("${OUTFILE}")
    echo "GENERATED: ${OUTFILE}"
    echo
}

function optimizeSvg () {
    local INFILE=$1
    local OUTFILE=$2
    echo "${SEP2}OPTIMIZING SVG: "
    echo "\"${INFILE}\" -> scour() -> \"${OUTFILE}\"... "
    [ -f "${OUTFILE}" ] && rm "${OUTFILE}"
    # generate optimised SVG
    # "${SCOUR}" "${INFILE}" "${OUTFILE}" --enable-viewboxing --enable-id-stripping   --enable-comment-stripping --shorten-ids --indent=none
    "${SVGO}" "${INFILE}" -o "${OUTFILE}"
    [ ! -r "${OUTFILE}" ] && echo "Error, result file ${OUTFILE} not found" && exit 1;
    created+=("${OUTFILE}")
    echo "GENERATED: ${OUTFILE}"
    echo
}

function generateIco () {
    local INFILE=$1
    local OUTFILE=$2
    shift 2
    local SIZES=("$@")

    # Convert SIZES space-separated string to an Array. Note - do not quote, ignore shellcheck SC2206 warning.
    # SIZES variable is not an Array (bash and others cannot export Arrays), it is
    # a space-separated list of numbers
    echo "${SEP2}GENERATING ICO: "
    [ -f "${OUTFILE}" ] && rm "${OUTFILE}"
    local files=()
    for size in "${SIZES[@]}"; do
        local TMPFILE="${SOURCE}/__tmp-${size}.png"
        [ -f "${TMPFILE}" ] && rm "${TMPFILE}"
        echo "\"${INFILE}\" -> size(${size}) -> \"${TMPFILE}\"... "
        "${INKSCAPE}" -h "$size" "${INFILE}" --export-filename "${TMPFILE}"
        # >/dev/null 2>&1
        files+=("${TMPFILE}")
    done
    echo "  ++all++ -> \"${OUTFILE}\"... "
    "${CONVERT}" -background transparent "${files[@]}" -colors 256 "${OUTFILE}"
    rm "${files[@]}"    
    [ ! -r "${OUTFILE}" ] && echo "Error, result file ${OUTFILE} not found" && exit 1;
    created+=("${OUTFILE}")
    echo "GENERATED: ${OUTFILE}"
    echo
}

# Legacy browsers <IE11 - favicon.ico embedding 16x16, 32x32 and 48x48, in the root of the website (no tag required - browser reaches out anyway)
# Most browsers   - faviconXXX.png
# Modern browsers - faviconXXX.svg
optimizeSvg "${FAVICON_SRC}" "${OUTPUT_DIR}/favicon.svg"
generatePng "${FAVICON_SRC}" "${OUTPUT_DIR}/favicon-16x16.png"          16
generatePng "${FAVICON_SRC}" "${OUTPUT_DIR}/favicon-32x32.png"          32
generatePng "${FAVICON_SRC}" "${OUTPUT_DIR}/favicon-48x48.png"          48

generateIco "${FAVICON_SRC}" "${OUTPUT_DIR}/favicon.ico"                16 32 48

# iOS Safari - "touch icon", a 180x180 PNG image, no transparency, its corners will be automatically rounded.
# (167x167 for iPad)
# <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
# TODO: (when needed) Remove transparency (when separate APPICON_SRC_BG file is not given)
generatePng "${APPICON_SRC_BG}" "${OUTPUT_DIR}/apple-icon-167x167.png" 167
generatePng "${APPICON_SRC_BG}" "${OUTPUT_DIR}/apple-icon-180x180.png" 180

# Android - 192x192 and 512x512 PNG images, transparency allowed and encouraged.
# The manifest is declared with:
#   <link rel="manifest" href="/manifest.webmanifest">
# The manifest is also required for Service Worker / Offline support, so declare icons only there.
generatePng "${APPICON_SRC}" "${OUTPUT_DIR}/icon-192x192.png"          192
generatePng "${APPICON_SRC}" "${OUTPUT_DIR}/icon-512x512.png"          512

# For Readme
generatePng "${APPICON_SRC_TXR}" "${OUTPUT_DIR}/icon-txr-512x512.png"  512

#echo "${created[@]}"
echo "${SEP2}Created files: "
for i in "${created[@]}"; do
   echo "  - $i" 
done
echo
echo "Done."
