module.exports = function(req, res) {
  res.status(200).json({ ok: true, msg: 'funcao rodando', time: new Date().toISOString() })
}
