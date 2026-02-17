/**
 * SERVICIO DE ATAJOS DE TECLADO
 * Gestiona todos los atajos del teclado de forma centralizada
 */

import React from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  callback: () => void;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  /**
   * Registra un nuevo atajo de teclado
   */
  register(shortcut: KeyboardShortcut) {
    const key = this.generateKey(shortcut);
    this.shortcuts.set(key, shortcut);
    console.log(`⌨️ Atajo registrado: ${shortcut.description}`);
  }

  /**
   * Desregistra un atajo
   */
  unregister(shortcut: KeyboardShortcut) {
    const key = this.generateKey(shortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Genera una clave única para el atajo basada en las teclas
   */
  private generateKey(shortcut: KeyboardShortcut): string {
    return `${shortcut.ctrl ? 'ctrl' : ''}${shortcut.shift ? 'shift' : ''}${shortcut.alt ? 'alt' : ''}${shortcut.key.toLowerCase()}`;
  }

  /**
   * Maneja el evento de teclado
   */
  handleKeyDown(event: KeyboardEvent) {
    // Ignorar si está escribiendo en un input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Permitir Ctrl+K (búsqueda) incluso en inputs
      if (!(event.ctrlKey && event.key.toLowerCase() === 'k')) {
        return;
      }
    }

    for (const shortcut of this.shortcuts.values()) {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (shortcut.ctrl ? event.ctrlKey : !event.ctrlKey) &&
        (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
        (shortcut.alt ? event.altKey : !event.altKey)
      ) {
        event.preventDefault();
        shortcut.callback();
        return;
      }
    }
  }

  /**
   * Retorna todos los atajos registrados
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Formatea el atajo para mostrar al usuario
   */
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  }
}

// Instancia global
export const shortcutManager = new KeyboardShortcutManager();

/**
 * Hook para usar atajos en componentes React
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    // Registrar atajos
    shortcuts.forEach(s => shortcutManager.register(s));

    // Event listener
    const handleKeyDown = (e: KeyboardEvent) => shortcutManager.handleKeyDown(e);
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      shortcuts.forEach(s => shortcutManager.unregister(s));
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
