/*
global game, Hooks, Playlist, ui
*/

const MODULE = {
  id: 'vadanx-common-library',
  name: 'Vadanx\'s Common Library',
  hook: 'vadanx.init'
}

// eslint-disable-next-line no-unused-vars
class Log {
  constructor (id) {
    this.id = id
  }

  debug (line) {
    const lineFmt = `${this.id} | ${line}`
    console.debug(lineFmt)
  }

  error (line) {
    const lineFmt = `${this.id} | ${line}`
    console.error(lineFmt)
    ui.notifications.error(lineFmt)
  }

  info (line) {
    const lineFmt = `${this.id} | ${line}`
    console.log(lineFmt)
  }

  warn (line) {
    const lineFmt = `${this.id} | ${line}`
    console.warn(lineFmt)
    ui.notifications.warn(lineFmt)
  }
}

// eslint-disable-next-line no-unused-vars
class Control {
  constructor (id) {
    this.id = id
    this.log = new Log(this.id)
  }

  create (controls, control) {
    let controlsCategoryTools
    if (!control.category) {
      controlsCategoryTools = controls
    } else {
      controlsCategoryTools = controls.find(
        c => c.name === control.category
      ).tools
    }
    if (game && !controlsCategoryTools.includes(control)) {
      this.log.info(`Creating control (name: ${control.name}, category: ${control.category}, layer: ${control.layer})`)
      controlsCategoryTools.push(control)
    }
  }
}

// eslint-disable-next-line no-unused-vars
class Config {
  constructor (id) {
    this.id = id
    this.log = new Log(this.id)
  }

  getMenuValue (itemKey) {
    this.log.info(`Getting value from menu ${itemKey}`)
    return game.settings.get(this.id, itemKey)
  }

  setMenus (items) {
    for (const [itemKey, itemValue] of Object.entries(items)) {
      this.log.info(`Setting menu ${itemKey}`)
      game.settings.register(this.id, itemKey, itemValue)
    }
  }
}

// eslint-disable-next-line no-unused-vars
class Music {
  constructor (id) {
    this.id = id
    this.log = new Log(this.id)
  }

  getPlaylists (playlistName) {
    let playlists = null
    switch (playlistName) {
      case 'current':
        playlists = game.playlists.playing
        break
      default:
        playlists = game.playlists.getName(playlistName)
        break
    }
    this.log.info('Getting playlists ' + playlistName)
    if (playlists === undefined) {
      return playlists
    } else {
      return [playlists].flat(Infinity)
    }
  }

  preloadPlaylists (playlists) {
    if (playlists != null) {
      playlists.forEach(
        p => {
          this.log.info('Preloading playlist ' + p.name)
          game.playlists.getName(p.name).playbackOrder.forEach(
            s => {
              const path = game.playlists.getName(p.name).sounds.get(s).path
              if (path) {
                game.audio.preload(path)
              }
            }
          )
        }
      )
    }
  }

  startPlaylists (playlists) {
    this.log.info('Starting playlists ' + playlists)
    if (playlists != null) {
      playlists.forEach(
        p => {
          this.log.info('Starting playlist ' + p.name)
          game.playlists.getName(p.name).playAll()
        }
      )
    }
  }

  stopPlaylists (playlists) {
    this.log.info('Stopping playlists ' + playlists)
    if (playlists != null) {
      playlists.forEach(
        p => {
          this.log.info('Stopping playlist ' + p.name)
          game.playlists.getName(p.name).stopAll()
        }
      )
    }
  }

  async createPlaylistWithTracks (playlistName, tracks) {
    if (game.users.get(game.userId)?.isGM) {
      const playlists = this.getPlaylists(playlistName)
      if (playlists === undefined) {
        this.log.info('Creating playlist ' + playlistName)
        await Playlist.create({
          description: 'Playlist created by ' + this.id,
          fade: 1000,
          mode: 1,
          name: playlistName,
          playing: false,
          sorting: 'a'
        })
        const playlist = await game.playlists?.contents.find((p) => p.name === playlistName)
        for (const track of tracks) {
          this.log.info('Adding playlist track ' + track.name)
          await playlist.createEmbeddedDocuments('PlaylistSound', [{
            description: track.description,
            fade: 1000,
            name: track.name,
            path: track.path,
            repeat: true,
            volume: track.volume
          }], {})
        }
      } else {
        this.log.info('Found playlist ' + playlistName)
      }
    }
  }
}

// eslint-disable-next-line no-unused-vars
class Time {
  constructor (id) {
    this.id = id
    this.log = new Log(this.id)
  }

  wait (ms = 1000) {
    this.log.info(`Waiting for ${ms} ms`)
    // eslint-disable-next-line promise/param-names
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

const log = new Log(MODULE.id)

Hooks.on('init', () => {
  log.info('Hooked on init')
  game.modules.get(MODULE.id).api = {
    Config,
    Control,
    Log,
    Music,
    Time
  }
  log.info('Calling hook ' + MODULE.hook)
  Hooks.callAll(MODULE.hook, game.modules.get(MODULE.id).api)
})
