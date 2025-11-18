#!/bin/bash
set -e

# VidFix Pro - Remote Installation Script
# Usage: curl -sSL https://raw.githubusercontent.com/staubi82/vidfix/main/install.sh | bash

APP_NAME="vidfix-app"
REPO_OWNER="staubi82"
REPO_NAME="vidfix"
INSTALL_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP_DIR="$HOME/.local/share/applications"
TMP_DIR="/tmp/vidfix-install"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Helper
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_header() { echo -e "${CYAN}${BOLD}$1${NC}"; }

# Banner
show_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}          ${BOLD}VidFix Pro - Installation Manager${NC}            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    Moderne ffmpeg GUI für Video-Transcodierung        ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Prüfe ob curl oder wget verfügbar ist
check_download_tool() {
    if command -v curl &> /dev/null; then
        DOWNLOAD_CMD="curl -fsSL"
        return 0
    elif command -v wget &> /dev/null; then
        DOWNLOAD_CMD="wget -qO-"
        return 0
    else
        print_error "Weder curl noch wget gefunden!"
        print_info "Bitte installieren: sudo pacman -S curl"
        exit 1
    fi
}

# Hole neueste Release-Info von GitHub
get_latest_release() {
    print_info "Suche nach neuester Version..."

    # GitHub API für neuestes Release
    API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest"

    if command -v curl &> /dev/null; then
        RELEASE_INFO=$(curl -sSL "$API_URL" 2>/dev/null || echo "")
    else
        RELEASE_INFO=$(wget -qO- "$API_URL" 2>/dev/null || echo "")
    fi

    if [ -z "$RELEASE_INFO" ]; then
        print_error "Konnte Release-Informationen nicht abrufen!"
        print_warning "Mögliche Gründe:"
        echo "  - Keine Releases auf GitHub veröffentlicht"
        echo "  - Repository ist privat (Download benötigt Token)"
        echo "  - Netzwerkproblem"
        return 1
    fi

    # Extrahiere AppImage URL
    APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url":\s*"\K[^"]*\.AppImage' | head -n 1)
    VERSION=$(echo "$RELEASE_INFO" | grep -oP '"tag_name":\s*"\K[^"]*' | head -n 1)

    if [ -z "$APPIMAGE_URL" ]; then
        print_error "Keine AppImage-Datei in neuesten Release gefunden!"
        return 1
    fi

    print_success "Neueste Version gefunden: $VERSION"
    return 0
}

# Icon von GitHub herunterladen
download_icon() {
    print_info "Lade Icon herunter..."

    ICON_URL="https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/main/vidfix-app/resources/icon.png"

    mkdir -p "$ICON_DIR"

    if command -v curl &> /dev/null; then
        curl -fsSL "$ICON_URL" -o "$ICON_DIR/vidfix-app.png" 2>/dev/null || {
            print_warning "Icon-Download fehlgeschlagen (nicht kritisch)"
            return 1
        }
    else
        wget -qO "$ICON_DIR/vidfix-app.png" "$ICON_URL" 2>/dev/null || {
            print_warning "Icon-Download fehlgeschlagen (nicht kritisch)"
            return 1
        }
    fi

    print_success "Icon installiert"
    return 0
}

# AppImage herunterladen
download_appimage() {
    mkdir -p "$TMP_DIR"

    print_info "Lade AppImage herunter..."
    print_info "URL: $APPIMAGE_URL"

    if command -v curl &> /dev/null; then
        if curl -fL --progress-bar "$APPIMAGE_URL" -o "$TMP_DIR/$APP_NAME.AppImage"; then
            print_success "Download abgeschlossen"
            return 0
        fi
    else
        if wget --show-progress -O "$TMP_DIR/$APP_NAME.AppImage" "$APPIMAGE_URL"; then
            print_success "Download abgeschlossen"
            return 0
        fi
    fi

    print_error "Download fehlgeschlagen!"
    print_info "Falls das Repository privat ist, lade die AppImage manuell herunter:"
    echo "  1. Gehe zu: https://github.com/$REPO_OWNER/$REPO_NAME/releases/latest"
    echo "  2. Lade die .AppImage Datei herunter"
    echo "  3. Führe dieses Script lokal aus: ./install.sh install"
    return 1
}

# Installation
install_app() {
    print_header "Installation von VidFix Pro"
    echo ""

    # Check download tool
    check_download_tool

    # Hole neueste Release-Info
    if ! get_latest_release; then
        print_error "Installation abgebrochen."
        exit 1
    fi

    # AppImage herunterladen
    if ! download_appimage; then
        exit 1
    fi

    # Verzeichnisse erstellen
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DESKTOP_DIR"

    # AppImage installieren
    print_info "Installiere AppImage..."
    cp "$TMP_DIR/$APP_NAME.AppImage" "$INSTALL_DIR/$APP_NAME"
    chmod +x "$INSTALL_DIR/$APP_NAME"
    print_success "AppImage installiert nach $INSTALL_DIR/$APP_NAME"

    # Icon herunterladen
    download_icon

    # Desktop-Datei erstellen
    print_info "Erstelle Desktop-Integration..."
    cat > "$DESKTOP_DIR/vidfix-app.desktop" <<EOF
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

    # Cleanup
    rm -rf "$TMP_DIR"

    echo ""
    print_success "Installation erfolgreich abgeschlossen!"
    echo ""
    print_info "VidFix Pro sollte jetzt im Startmenü erscheinen."
    print_info "Tipp: Super-Taste drücken und 'VidFix' eingeben"
    echo ""
    print_info "Falls nicht sofort sichtbar, GNOME Shell neu starten:"
    echo -e "  - X11: ${CYAN}killall -3 gnome-shell${NC}"
    echo -e "  - Wayland: ${CYAN}Alt+F2${NC}, dann ${CYAN}'r'${NC} eingeben"
    echo ""
}

# Update
update_app() {
    print_header "Update von VidFix Pro"
    echo ""

    # Prüfen ob installiert
    if [ ! -f "$INSTALL_DIR/$APP_NAME" ]; then
        print_error "VidFix Pro ist nicht installiert!"
        print_info "Verwende 'install' für die erste Installation."
        exit 1
    fi

    # Aktuelle Version anzeigen
    if [ -f "$INSTALL_DIR/.vidfix-version" ]; then
        CURRENT_VERSION=$(cat "$INSTALL_DIR/.vidfix-version")
        print_info "Installierte Version: $CURRENT_VERSION"
    fi

    # Check download tool
    check_download_tool

    # Hole neueste Version
    if ! get_latest_release; then
        exit 1
    fi

    # AppImage herunterladen
    if ! download_appimage; then
        exit 1
    fi

    # Backup erstellen
    print_info "Erstelle Backup..."
    cp "$INSTALL_DIR/$APP_NAME" "$INSTALL_DIR/$APP_NAME.backup"

    # Neue Version installieren
    print_info "Installiere Update..."
    cp "$TMP_DIR/$APP_NAME.AppImage" "$INSTALL_DIR/$APP_NAME"
    chmod +x "$INSTALL_DIR/$APP_NAME"
    print_success "AppImage aktualisiert"

    # Version speichern
    echo "$VERSION" > "$INSTALL_DIR/.vidfix-version"

    # Backup entfernen
    rm "$INSTALL_DIR/$APP_NAME.backup"

    # Cleanup
    rm -rf "$TMP_DIR"

    echo ""
    print_success "Update erfolgreich abgeschlossen!"
    print_info "Neue Version: $VERSION"
    echo ""
}

# Deinstallation
uninstall_app() {
    print_header "Deinstallation von VidFix Pro"
    echo ""

    # Prüfen ob installiert
    if [ ! -f "$INSTALL_DIR/$APP_NAME" ]; then
        print_warning "VidFix Pro ist nicht installiert."
        exit 0
    fi

    # Bestätigung
    read -p "Wirklich deinstallieren? [j/N]: " confirm < /dev/tty
    if [ "$confirm" != "j" ] && [ "$confirm" != "J" ]; then
        print_info "Abgebrochen."
        exit 0
    fi

    # Entfernen
    print_info "Entferne VidFix Pro..."

    rm -f "$INSTALL_DIR/$APP_NAME"
    rm -f "$INSTALL_DIR/.vidfix-version"
    rm -f "$ICON_DIR/vidfix-app.png"
    rm -f "$DESKTOP_DIR/vidfix-app.desktop"

    print_success "Dateien entfernt"

    # Desktop-Datenbank aktualisieren
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
    fi

    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache "$HOME/.local/share/icons/hicolor/" -f 2>/dev/null || true
    fi

    echo ""
    print_success "Deinstallation abgeschlossen!"
    echo ""
}

# Hauptmenü
show_menu() {
    show_banner

    echo -e "  ${BOLD}1)${NC} Installieren     - Erste Installation"
    echo -e "  ${BOLD}2)${NC} Update           - Auf neueste Version aktualisieren"
    echo -e "  ${BOLD}3)${NC} Deinstallieren   - Vollständig entfernen"
    echo -e "  ${BOLD}4)${NC} Abbrechen"
    echo ""
    read -p "Auswahl [1-4]: " choice < /dev/tty

    case $choice in
        1) install_app ;;
        2) update_app ;;
        3) uninstall_app ;;
        4) print_info "Abgebrochen."; exit 0 ;;
        *) print_error "Ungültige Auswahl!"; exit 1 ;;
    esac
}

# Main
if [ $# -eq 0 ]; then
    # Kein Parameter -> Menü
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
            show_banner
            echo "Verwendung:"
            echo -e "  ${CYAN}curl -sSL https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/main/install.sh | bash${NC}"
            echo ""
            echo "Oder lokal:"
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
