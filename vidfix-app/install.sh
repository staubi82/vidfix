#!/bin/bash
set -e

# VidFix Pro - Installation Script
# Automatische Installation/Update/Deinstallation für GNOME

APP_NAME="vidfix-app"
INSTALL_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_NAME="vidfix-app.png"
DESKTOP_FILE="vidfix-app.desktop"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper Funktionen
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# AppImage finden (lokal oder download)
find_appimage() {
    # Suche in dist/ Verzeichnis
    if [ -d "dist" ]; then
        APPIMAGE=$(find dist -name "*.AppImage" -type f | head -n 1)
        if [ -n "$APPIMAGE" ]; then
            echo "$APPIMAGE"
            return 0
        fi
    fi

    # Suche im aktuellen Verzeichnis
    APPIMAGE=$(find . -maxdepth 1 -name "*.AppImage" -type f | head -n 1)
    if [ -n "$APPIMAGE" ]; then
        echo "$APPIMAGE"
        return 0
    fi

    return 1
}

# Installation
install_app() {
    print_info "Starte Installation von VidFix Pro..."

    # AppImage finden
    APPIMAGE=$(find_appimage)
    if [ -z "$APPIMAGE" ]; then
        print_error "Kein AppImage gefunden!"
        print_info "Bitte zuerst 'npm run build' ausführen oder AppImage herunterladen."
        exit 1
    fi

    print_info "Gefundenes AppImage: $APPIMAGE"

    # Verzeichnisse erstellen
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$ICON_DIR"
    mkdir -p "$DESKTOP_DIR"

    # AppImage kopieren
    cp "$APPIMAGE" "$INSTALL_DIR/$APP_NAME"
    chmod +x "$INSTALL_DIR/$APP_NAME"
    print_success "AppImage installiert nach $INSTALL_DIR/$APP_NAME"

    # Icon kopieren
    if [ -f "resources/icon.png" ]; then
        cp "resources/icon.png" "$ICON_DIR/$ICON_NAME"
        print_success "Icon installiert"
    else
        print_warning "Icon nicht gefunden (resources/icon.png)"
    fi

    # Desktop-Datei erstellen
    cat > "$DESKTOP_DIR/$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=VidFix Pro
Comment=Moderne ffmpeg GUI für professionelle Video-Transcodierung
Exec=$INSTALL_DIR/$APP_NAME
Icon=vidfix-app
Terminal=false
Type=Application
Categories=AudioVideo;Video;
Keywords=video;transcoding;ffmpeg;dnxhr;prores;davinci;
StartupNotify=true
StartupWMClass=vidfix-app
EOF
    print_success "Desktop-Datei erstellt"

    # Desktop-Datenbank aktualisieren
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
        print_success "Desktop-Datenbank aktualisiert"
    fi

    # Icon-Cache aktualisieren
    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache "$HOME/.local/share/icons/hicolor/" -f 2>/dev/null || true
        print_success "Icon-Cache aktualisiert"
    fi

    echo ""
    print_success "Installation abgeschlossen!"
    print_info "VidFix Pro sollte jetzt im Startmenü erscheinen (Super-Taste drücken)."
    print_info "Falls nicht sofort sichtbar, GNOME Shell neu starten:"
    echo "          - X11: killall -3 gnome-shell"
    echo "          - Wayland: Alt+F2, dann 'r' eingeben"
}

# Update (nur AppImage)
update_app() {
    print_info "Starte Update von VidFix Pro..."

    # Prüfen ob installiert
    if [ ! -f "$INSTALL_DIR/$APP_NAME" ]; then
        print_error "VidFix Pro ist nicht installiert!"
        print_info "Verwende 'install' statt 'update'."
        exit 1
    fi

    # AppImage finden
    APPIMAGE=$(find_appimage)
    if [ -z "$APPIMAGE" ]; then
        print_error "Kein AppImage gefunden!"
        print_info "Bitte zuerst 'npm run build' ausführen oder AppImage herunterladen."
        exit 1
    fi

    print_info "Gefundenes AppImage: $APPIMAGE"

    # Alte Version sichern
    cp "$INSTALL_DIR/$APP_NAME" "$INSTALL_DIR/$APP_NAME.backup"
    print_info "Backup erstellt: $INSTALL_DIR/$APP_NAME.backup"

    # Neue Version kopieren
    cp "$APPIMAGE" "$INSTALL_DIR/$APP_NAME"
    chmod +x "$INSTALL_DIR/$APP_NAME"
    print_success "AppImage aktualisiert"

    # Backup entfernen
    rm "$INSTALL_DIR/$APP_NAME.backup"

    echo ""
    print_success "Update abgeschlossen!"
}

# Deinstallation
uninstall_app() {
    print_info "Starte Deinstallation von VidFix Pro..."

    # AppImage entfernen
    if [ -f "$INSTALL_DIR/$APP_NAME" ]; then
        rm "$INSTALL_DIR/$APP_NAME"
        print_success "AppImage entfernt"
    fi

    # Icon entfernen
    if [ -f "$ICON_DIR/$ICON_NAME" ]; then
        rm "$ICON_DIR/$ICON_NAME"
        print_success "Icon entfernt"
    fi

    # Desktop-Datei entfernen
    if [ -f "$DESKTOP_DIR/$DESKTOP_FILE" ]; then
        rm "$DESKTOP_DIR/$DESKTOP_FILE"
        print_success "Desktop-Datei entfernt"
    fi

    # Desktop-Datenbank aktualisieren
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
        print_success "Desktop-Datenbank aktualisiert"
    fi

    # Icon-Cache aktualisieren
    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache "$HOME/.local/share/icons/hicolor/" -f 2>/dev/null || true
        print_success "Icon-Cache aktualisiert"
    fi

    echo ""
    print_success "Deinstallation abgeschlossen!"
}

# Download von GitHub Releases (optional)
download_from_github() {
    print_info "Download von GitHub Releases..."

    # GitHub Release URL (anpassen falls nötig)
    REPO="staubi82/vidfix"

    print_warning "Automatischer Download von privaten GitHub Repos erfordert einen Token."
    print_info "Verwende stattdessen die lokale AppImage-Datei aus 'npm run build'."

    return 1
}

# Hauptmenü
show_menu() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║          VidFix Pro - Installation Manager            ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "  1) Installieren    - Erste Installation"
    echo "  2) Update          - Nur AppImage aktualisieren"
    echo "  3) Deinstallieren  - Vollständig entfernen"
    echo "  4) Abbrechen"
    echo ""
    read -p "Auswahl [1-4]: " choice

    case $choice in
        1)
            install_app
            ;;
        2)
            update_app
            ;;
        3)
            read -p "Wirklich deinstallieren? [j/N]: " confirm
            if [ "$confirm" = "j" ] || [ "$confirm" = "J" ]; then
                uninstall_app
            else
                print_info "Abgebrochen."
            fi
            ;;
        4)
            print_info "Abgebrochen."
            exit 0
            ;;
        *)
            print_error "Ungültige Auswahl!"
            exit 1
            ;;
    esac
}

# Kommandozeilen-Parameter verarbeiten
if [ $# -eq 0 ]; then
    # Kein Parameter -> Menü anzeigen
    show_menu
else
    case "$1" in
        install)
            install_app
            ;;
        update)
            update_app
            ;;
        uninstall|remove)
            uninstall_app
            ;;
        --help|-h)
            echo "VidFix Pro - Installation Manager"
            echo ""
            echo "Verwendung:"
            echo "  ./install.sh              Interaktives Menü"
            echo "  ./install.sh install      Installieren"
            echo "  ./install.sh update       Update"
            echo "  ./install.sh uninstall    Deinstallieren"
            echo ""
            ;;
        *)
            print_error "Unbekannter Parameter: $1"
            echo "Verwende --help für Hilfe"
            exit 1
            ;;
    esac
fi
