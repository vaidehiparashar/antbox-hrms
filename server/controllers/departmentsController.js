const db = require('../database/db');

const getAllDepartments = async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, name FROM departments',
      args: []
    });
    res.json({
      success: true,
      message: 'Departments fetched successfully',
      data: result.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments };
