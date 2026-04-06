# Stage 1: Build the custom UI from source
FROM node:18 AS ui-builder
WORKDIR /ui
COPY aim/web/ui/package.json aim/web/ui/yarn.lock* ./
RUN mkdir -p public && npm install --legacy-peer-deps
COPY aim/web/ui/ ./
RUN npx react-app-rewired --max_old_space_size=4096 build

# Stage 2: Python + aim with custom UI
FROM python:3.10
COPY . /aim-video
WORKDIR /aim-video
RUN pip install -e .

# Overwrite the pre-built aim-ui with our custom build
RUN AIM_UI_DIR=$(python3 -c "import aim_ui; import os; print(os.path.dirname(aim_ui.__file__))") && \
    rm -rf "$AIM_UI_DIR/build" && \
    echo "Cleared $AIM_UI_DIR/build"
COPY --from=ui-builder /ui/build/ /aim-ui-build/
RUN AIM_UI_DIR=$(python3 -c "import aim_ui; import os; print(os.path.dirname(aim_ui.__file__))") && \
    cp -r /aim-ui-build "$AIM_UI_DIR/build" && \
    rm -rf /aim-ui-build && \
    echo "Installed custom UI to $AIM_UI_DIR/build"

WORKDIR /opt/aim
CMD aim init || true && aim up --host 0.0.0.0
