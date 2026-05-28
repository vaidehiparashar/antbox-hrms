const db = require('../database/db');
const { sendMailAccepted, sendMailRejected } = require('../services/mailService');

const getAllMails = async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM mails ORDER BY id DESC';
    const mailsRes = await db.execute({ sql, args: [] });

    res.json({
      success: true,
      message: 'Mails fetched successfully',
      data: mailsRes.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const acceptMail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch mail details
    const mailRes = await db.execute({
      sql: 'SELECT * FROM mails WHERE id = ?',
      args: [id]
    });

    if (mailRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mail not found', data: null, meta: null });
    }

    const mail = mailRes.rows[0];

    // 2. Mark status as read/accepted
    await db.execute({
      sql: "UPDATE mails SET status = 'accepted' WHERE id = ?",
      args: [id]
    });

    // 3. Send Auto-Reply
    await sendMailAccepted(mail.sender_email, mail.sender_name).catch(err => {
      console.error('Mail acceptance auto-reply failed:', err.message);
    });

    res.json({
      success: true,
      message: 'Mail inquiry accepted and auto-reply sent',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const rejectMail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch mail details
    const mailRes = await db.execute({
      sql: 'SELECT * FROM mails WHERE id = ?',
      args: [id]
    });

    if (mailRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mail not found', data: null, meta: null });
    }

    const mail = mailRes.rows[0];

    // 2. Mark status as read/rejected
    await db.execute({
      sql: "UPDATE mails SET status = 'rejected' WHERE id = ?",
      args: [id]
    });

    // 3. Send Auto-Rejection
    await sendMailRejected(mail.sender_email, mail.sender_name).catch(err => {
      console.error('Mail rejection auto-reply failed:', err.message);
    });

    res.json({
      success: true,
      message: 'Mail inquiry rejected and auto-reply sent',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMails,
  acceptMail,
  rejectMail
};
