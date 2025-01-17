#!/bin/sh -e
# Motivation: `npm run build` is very slow, the fastest
#             way to get the UI up is `docker pull ... `
#             However, the backend url is built-in
#             to be http://localhost:8000/api/v1/
# Purpose:    Overwrite the URL of backend using a user-specified value.
#             `sed` is used to patch the `build/` directory.

target_cube='http://localhost:8000/api/v1/'
target_pfdcm='http://localhost:4005/'
given_cube="${REACT_APP_CHRIS_UI_URL-nil}"
given_pfdcm="${REACT_APP_PFDCM_URL-nil}"

if [ "$(id -u)" != "0" ]; then
  if [ "$given_cube" != 'nil' ]; then
    echo "ERROR: custom value REACT_APP_CHRIS_UI_URL=$given_cube"
    echo "is set, but container user is not root."
    exit 1
  fi
  if [ "$given_pfdcm" != 'nil' ]; then
    echo "ERROR: custom value REACT_APP_PFDCM_URL=$given_pfdcm"
    echo "is set, but container user is not root."
    exit 1
  fi
fi

# When running on Podman with default settings, the host IP address is added to /etc/hosts
# by Podman by the name "host.containers.local" which we'll use as the IP address.
if [ "${DISABLE_PODMAN_HOST_IP-no}" = 'no' ] \
  && [ "$given_cube" = 'nil' ] \
  && [ "$given_pfdcm" = 'nil' ]; then
  
  PODMAN_HOST_IP="$(grep -m 1 -F host.containers.internal /etc/hosts | awk '{print $1}')"
  if [ -n "$PODMAN_HOST_IP" ]; then
    echo "Detected Podman host IP: $PODMAN_HOST_IP"
    given_cube="http://$PODMAN_HOST_IP:8000/api/v1/"
    given_pfdcm="http://$PODMAN_HOST_IP:4005/"
  fi 
fi

function replace () {
  local target="$1"
  local api_url="$2"

  if [ "$api_url"  != 'nil' ]; then
    for build_file in $(find -type f); do
      sed -i -e "s#$target#$api_url#g" $build_file
    done
  fi
}

replace  "$target_cube"  "$given_cube"
replace  "$target_pfdcm" "$given_pfdcm"

exec "$@"
