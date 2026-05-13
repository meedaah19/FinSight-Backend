import express from 'express';
import Expense from '../models/expenses.js';
import { auth } from '../middlewares/auth.js';

const controllerRouter = express.Router();

controllerRouter.get("/expenses/insights", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const summaryResult = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalAssets = 0;

    summaryResult.forEach(item => {
      if (item._id === "income") totalIncome = item.total;
      if (item._id === "expense") totalExpense = item.total;
      if (item._id === "asset") totalAssets = item.total;
    });

    const balance = totalIncome - totalExpense;

    let spentPercent = 0;
    let investedPercent = 0;
    let savedPercent = 0;

    if (totalIncome > 0) {
    spentPercent = ((totalExpense / totalIncome) * 100).toFixed(1);
    investedPercent = ((totalAssets / totalIncome) * 100).toFixed(1);
    savedPercent = ((balance / totalIncome) * 100).toFixed(1);
    }

    const trends = await Expense.aggregate([
      { $match: { user: userId, type: "expense" } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          totalExpense: { $sum: "$amount" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]);

    const monthlyTrends = trends.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      totalExpense: item.totalExpense
    }));

    let insights = [];

    if (monthlyTrends.length >= 2) {
      const last = monthlyTrends[monthlyTrends.length - 1];
      const prev = monthlyTrends[monthlyTrends.length - 2];

     if (last.totalExpense > prev.totalExpense) {
        insights.push({
          message: "You spent more this month than last month",
          type: "warning"
        });
      } else if (last.totalExpense < prev.totalExpense) {
        insights.push({
          message: "You spent less this month than last month",
          type: "success"
        });
      } else {
        insights.push({
          message: "Your spending is the same as last month",
          type: "info"
        });
      }
    }

    if (monthlyTrends.length > 0) {
      const highest = monthlyTrends.reduce((max, item) =>
        item.totalExpense > max.totalExpense ? item : max
      );

     insights.push({
      message: `Your highest spending month is ${highest.month}`,
      type: "info"
    });
    }

    if (totalExpense > totalIncome) {
      insights.push({
        message: "You are spending more than you earn",
        type: "danger"
      });
    } else if (totalIncome > totalExpense) {
      insights.push({
        message: "Good job! Your income is higher than your spending",
        type: "success"
      });
    }

    let warning = null;
    let status = "good";
    let message = "✅ Great! You are within your budget";
    
    const budget = req.user.budget;

    if (budget > 0) {
    if (totalExpense > budget) {
      status = "danger";
      message = "🚨 Budget exceeded!";
    } else if (totalExpense > budget * 0.8) {
      status = "warning";
      message = "⚠️ You are close to your budget limit";
    }
  }

   if (totalExpense > totalAssets) {
      insights.push({
        message: "You are spending more than you are investing",
        type: "danger"
      });
    } else if (totalAssets > totalExpense) {
      insights.push({
        message: "Good job! You are investing more than spending",
        type: "success"
      });
    }
    
    res.send({
      summary: {
        totalIncome,
        totalExpense,
        totalAssets,
        balance
      },
      ratios: {
        spent: spentPercent + "%",
        invested: investedPercent + "%",
        saved: savedPercent + "%"
    },
      monthlyTrends,        
      insights,         
      status,
      message
    });

  } catch (error) {
    res.status(500).send({
      message: "Error generating financial insights",
      error: error.message
    });
  }
});

controllerRouter.get("/expenses/summary", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      user: req.user._id,
    };

    if (startDate || endDate) {
      matchStage.date = {};

      if (startDate) {
        matchStage.date.$gte = new Date(startDate);
      }

      if (endDate) {
        matchStage.date.$lte = new Date(endDate);
      }
    }

    const result = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const budget = req.user.budget;

    let status = "good";
    let message = "✅ Great! You are within your budget";    

    let insights = [];

    let totalIncome = 0;
    let totalExpense = 0;
    let totalAssets = 0;

    result.forEach((item) => {
      if (item._id === "income") totalIncome = item.total;
      if (item._id === "expense") totalExpense = item.total;
      if (item._id === "asset") totalAssets = item.total;
    });

    const totalSpent = totalExpense;

    if (budget > 0) {
      if (totalSpent > budget) {
        status = "danger";
        message = "🚨 Budget exceeded!";
      } else if (totalSpent > budget * 0.8) {
        status = "warning";
        message = "⚠️ You are close to your budget limit";
      }
    }

   if (totalExpense > totalAssets) {
      insights.push({
        message: "You are spending more than you are investing",
        status: "danger"
      });
    } else if (totalAssets > totalExpense) {
      insights.push({
        message: "Good job! You are investing more than spending",
        status: "success"
      });
    }

     if (totalExpense > totalIncome) {
      insights.push({
        message: "You are spending more than you earn",
        status: "danger"
      });
    } else if (totalIncome > totalExpense) {
      insights.push({
        message: "Good job! Your income is higher than your spending",
        status: "success"
      });
    }

    const balance = totalIncome - totalExpense;

    res.send({ 
      totalIncome, 
      totalExpense, 
      totalAssets, 
      balance, 
      insights, 
      status, 
      message, 
      totalSpent, 
      budget });

  } catch (error) {
    res.status(500).send({
      message: "Error generating summary",
      error: error.message,
    });
  }
});

controllerRouter.get("/expenses/category-summary", auth, async (req, res) => {
  try {
    const result = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          type: "expense"
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const totalAmount = result.reduce((sum, item) => sum + item.total, 0);

    const formatted = result.map(item => ({
      category: item._id,
      total: item.total,
      percentage: ((item.total / totalAmount) * 100).toFixed(1) + "%"
    }));

    res.send(formatted);

  } catch (error) {
    res.status(500).send({
      message: "Error generating category summary",
      error: error.message
    });
  }
});

controllerRouter.get("/expenses/monthly-trends", auth, async (req, res) => {
  try {
    const result = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date"}
          },
            totalExpense: {
            $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                }
            },

            totalIncome: {
                $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                }
            },
            totalAssets: {
                $sum: {
                $cond: [{ $eq: ["$type", "asset"] }, "$amount", 0]
                }
            }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]);

    // format output
    const formatted = result.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      totalExpense: item.totalExpense,
      totalIncome: item.totalIncome,
      totalAssets: item.totalAssets
    }));

    res.send(formatted);

  } catch (error) {
    res.status(500).send({
      message: "Error generating monthly trends",
      error: error.message
    });
  }
});

controllerRouter.get("/expenses/weekly-comparison", auth, async (req, res) => {
  try {
    const now = new Date();

    // start of this week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 7);

    // last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek);

    // aggregation
    const [thisWeekData, lastWeekData] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            type: "expense",
            date: {
              $gte: startOfThisWeek,
              $lt: endOfThisWeek
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]),

      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            type: "expense",
            date: {
              $gte: startOfLastWeek,
              $lt: endOfLastWeek
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ])
    ]);

    const thisWeek = thisWeekData[0]?.total || 0;
    const lastWeek = lastWeekData[0]?.total || 0;

    let message = "No spending data";

    if (thisWeek > lastWeek) {
      message = "You spent more this week than last week";
    } else if (thisWeek < lastWeek) {
      message = "You spent less this week than last week";
    } else if (thisWeek === lastWeek && thisWeek !== 0) {
      message = "Your spending is the same as last week";
    }

    res.send({
      thisWeek,
      lastWeek,
      message
    });

  } catch (error) {
    res.status(500).send({
      message: "Error generating weekly comparison",
      error: error.message
    });
  }
});

export { controllerRouter };