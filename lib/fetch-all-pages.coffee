"use strict"

fs = require('fs')
request = require('request')
_ = require('lodash')

module.exports = (side, what, callback, callbackParams) ->
  fetchAllPages(side, what, callback, callbackParams)

fetchAllPages = (side, dirtyWhat, callback, callbackParams) ->
  what = dirtyWhat.replace(/(\w+)\//gi, '')

  parsedConfig = JSON.parse(
    fs.readFileSync(
      './config2.json'
      { 'encoding': 'utf8' }
    )
  )
  config = parsedConfig[side]

  baseURL = "https://#{config.apiKey}:#{config.password}@#{config.shop}"
  path = "/admin/#{what}/count.json"

  params = {
    "side": side
    "what": what
    "baseURL": baseURL
    "requestLimit": 250
    "pageNumber": 1
    "callback": callback
    "callbackParams": callbackParams
  }

  console.log('Direction: '+side)
  console.log('What: '+what)
  console.log('Fetching from '+config.shop)

  request(
    {
      method: 'GET'
      uri: baseURL+path
    }
    (error, response, body) ->
      boundCountPages = _.bind(countPages, params, error, response, body)
      boundCountPages()
  )

countPages = (error, response, body) ->
  params = this
  if !error && response.statusCode == 200
    count = _.parseInt(JSON.parse(body).count)

    pagesCountModulo = count % this.requestLimit

    if pagesCountModulo > 0
      params.pagesCount = Math.floor(count / params.requestLimit) + 1
    else
      params.pagesCount = Math.floor(count / params.requestLimit)

    console.log "Number of items: #{count}"
    console.log "Number of pages: #{params.pagesCount}"

    getItems(params)
  else
    console.log "ERROR #{response.statusCode}"

getItems = (params) ->
  path = "/admin/#{params.what}.json"

  params.fileName = "data_#{params.side}_#{params.what}"
    .replace(/\W/gi, '_')
    .toLowerCase()
    .concat('.json')

  if params.pageNumber <= params.pagesCount
    queryStrings =
      limit: params.requestLimit
      page: params.pageNumber
    uri = params.baseURL + path

    if params.pageNumber == 1
      fs.writeFileSync(
        params.fileName
        "{\"#{params.what}\":["
        { encoding: 'utf8' }
      )

    console.log "Fetching page #{params.pageNumber} of #{params.what}"

    request(
      {
        method: 'GET'
        uri: uri
        qs: queryStrings
      }
      (error, response, body) ->
        boundAppendItems = _.bind(appendItems, params, error, response, body)
        boundAppendItems()
    )
  else
    fs.appendFileSync(
      params.fileName
      ']}'
      { 'encoding': 'utf8' }
    )
    if _.isFunction(params.callback)
      params.callback(params.callbackParams)

appendItems = (error, response, body) ->
  params = this
  if !error && response.statusCode == 200
    parsed = JSON.parse(body)
    result = parsed[params.what]

    joinedItems = _.map(
      result,
      (item) ->
        return JSON.stringify(item)
    ).join(',')

    if params.pageNumber < params.pagesCount
      fileContent = joinedItems.concat(',')
    else
      fileContent = joinedItems

    fs.appendFileSync(
      params.fileName
      fileContent
      { encoding: 'utf8' }
    )

    params.pageNumber = params.pageNumber + 1
    _.delay(
      getItems
      400
      params
    )
  else
    console.log "ERROR #{response.statusCode}"
