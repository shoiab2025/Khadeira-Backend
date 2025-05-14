import Leaderboard from "../models/leaderBoardModel.js";

// 🛠️ Create or Update Leaderboard Entry
import mongoose from "mongoose";

export const updateLeaderboard = async (testId, subjectId, lessonId, userId, score) => {
  try {
    const now = new Date();

    // 1. Ensure the leaderboard document exists
    let leaderboard = await Leaderboard.findOne({
      test: testId,
      subject: subjectId,
      lesson: lessonId,
    });

    if (!leaderboard) {
      leaderboard = await Leaderboard.create({
        test: testId,
        subject: subjectId,
        lesson: lessonId,
        rankings: [],
        best_score: score,
      });
    }

    const leaderboardId = leaderboard._id;

    // 2. Try to update existing user score if it's lower than new score
    const updated = await Leaderboard.updateOne(
      {
        _id: leaderboardId,
        "rankings.user": userId,
        "rankings.score": { $lt: score }, // Only update if new score is higher
      },
      {
        $set: {
          "rankings.$.score": score,
          "rankings.$.time_submitted": now,
        },
      }
    );

    // 3. If user wasn't found in rankings, push a new one
    if (updated.modifiedCount === 0) {
      await Leaderboard.updateOne(
        { _id: leaderboardId, "rankings.user": { $ne: userId } },
        {
          $push: {
            rankings: {
              user: userId,
              score: score,
              time_submitted: now,
            },
          },
        }
      );
    }

    // 4. Fetch updated leaderboard to recalculate ranks
    const updatedLeaderboard = await Leaderboard.findById(leaderboardId).populate("rankings.user");

    // 5. Sort and assign ranks
    updatedLeaderboard.rankings.sort((a, b) => {
      if (b.score === a.score) {
        return new Date(a.time_submitted) - new Date(b.time_submitted);
      }
      return b.score - a.score;
    });

    updatedLeaderboard.rankings.forEach((r, index) => {
      r.rank = index + 1;
    });

    updatedLeaderboard.best_score =
      updatedLeaderboard.rankings.length > 0 ? updatedLeaderboard.rankings[0].score : 0;

    await updatedLeaderboard.save();
    return updatedLeaderboard;

  } catch (err) {
    console.error("Error updating leaderboard:", err.message);
    throw err;
  }
};


// 🧩 Controller: GET Full Leaderboard

export const getLeaderboard = async (req, res) => {
  try {



    const leaderboard = await Leaderboard.find({})
      .populate("rankings.user", "name email") // populate user info
      .populate("test", "test_name")
      .populate("subject", "title")
      .populate("lesson", "name");


    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 🧩 Controller: GET Leaderboard by Test Only
export const getLeaderboardForTest = async (req, res) => {
  try {
    const { testId } = req.params;

    const leaderboard = await Leaderboard.findOne({ test: testId })
      .populate("rankings.user", "name email")
      .populate("test", "test_name")
      .populate("subject", "title")
      .populate("lesson", "name");

    if (!leaderboard) {
      return res.status(404).json({ success: false, message: "Leaderboard not found for this test" });
    }

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
