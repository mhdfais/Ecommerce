const Order = require("../Models/orders");
const Product = require("../Models/product");

const loadDashboard = async (req, res) => {
  try {
    // Calculate revenue, orders, etc., as before
    const revenue = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    let totalRevenue = revenue[0]?.totalRevenue || 0;

    const orders = await Order.aggregate([
      { $match: { $nor: [{ status: "Cancelled" }, { status: "Returned" }] } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    let totalOrders = orders[0]?.count || 0;

    const productsCount = await Product.countDocuments();

    const discount = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalDiscount: { $sum: "$discount" } } },
    ]);
    let totalDiscount = discount[0]?.totalDiscount || 0;

    // Chart data
    const ordersPie = await chart(); 
    const ordersGraph = await monthgraph(); 
    const ordersYearGraph = await yeargraph();
    // const ordersWeekGraph = await weekgraph();
    // console.log(ordersGraph)
    // console.log(ordersYearGraph)

    res.render("dashboard", {
      revenue: totalRevenue,
      totalOrders,
      productsCount,
      totalDiscount,
      ordersPie,
      ordersGraph,
      ordersYearGraph,
      // ordersWeekGraph
    });
  } catch (error) {
    console.log(error);
  }
};

const chart = async () => {
  const orderStatuses = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts = {
    pending: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orderStatuses.forEach((status) => {
    if (status._id === "Pending") statusCounts.pending = status.count;
    if (status._id === "Shipped") statusCounts.shipped = status.count;
    if (status._id === "Delivered") statusCounts.delivered = status.count;
    if (status._id === "Cancelled") statusCounts.cancelled = status.count;
  });

  return statusCounts;
};

const monthgraph = async () => {
  const currentYear = new Date().getFullYear();
  const ordersByMonth = await Order.aggregate([
    {
      $match: {
        orderDate: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$orderDate" },
        count: { $sum: 1 },
      },
    },
  ]);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const data = {
    labels: months,
    count: Array(12).fill(0),
  };

  ordersByMonth.forEach((order) => {
    data.count[order._id - 1] = order.count;
  });

  return data;
};

const yeargraph = async () => {
  const startYear = 2022;
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - startYear + 2 },
    (_, i) => startYear + i
  );

  const ordersByYear = await Order.aggregate([
    {
      $match: {
        orderDate: {
          $gte: new Date(`${startYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $year: "$orderDate" },
        count: { $sum: 1 },
      },
    },
  ]);

  const data = { labels: years, count: Array(years.length).fill(0) };

  ordersByYear.forEach((order) => {
    const index = data.labels.indexOf(order._id);
    if (index !== -1) data.count[index] = order.count;
  });

  return data;
};

// const weekgraph = async () => {
//   const today = new Date();
//   const past12Weeks = new Date();
//   past12Weeks.setDate(today.getDate() - 7 * 12); // 12 weeks ago

//   const ordersByWeek = await Order.aggregate([
//     {
//       $match: {
//         orderDate: {
//           $gte: past12Weeks,
//           $lte: today,
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { $isoWeek: "$orderDate" },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } }, // Sort by week ascending
//   ]);

//   // Generate an array of the last 12 weeks with counts defaulted to 0
//   const weeks = Array.from({ length: 12 }, (_, i) => {
//     const startOfWeek = new Date();
//     startOfWeek.setDate(today.getDate() - 7 * (11 - i));
//     return startOfWeek.toISOString().slice(0, 10); // Format as YYYY-MM-DD
//   });

//   const data = {
//     labels: weeks,
//     count: Array(12).fill(0),
//   };

//   ordersByWeek.forEach((order, index) => {
//     data.count[index] = order.count;
//   });

//   return data;
// };

// const loadDashboard = async (req, res) => {
//   try {
//     // find total revenue
//     const revenue = await Order.aggregate([
//       { $match: { paymentStatus: "Paid" } },
//       { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
//     ]);
//     let totalRevenue = revenue[0].totalRevenue;

//     // find total orders
//     const orders = await Order.aggregate([
//       {
//         $match: {
//           $nor: [{ status: "Cancelled" }, { status: "Returned" }],
//         },
//       },
//       { $group: { _id: null, count: { $sum: 1 } } },
//     ]);
//     let totalOrders = orders[0].count;

//     // find total number of products
//     const productsCount = await Product.countDocuments();

//     // find total discount amount
//     const discount = await Order.aggregate([
//       { $match: { status: { $ne: "Cancelled" } } },
//       { $group: { _id: null, totalDiscount: { $sum: "$discount" } } },
//     ]);
//     let totalDiscount = discount[0].totalDiscount;

//     // console.log(revenue)

//     const salesData=await getSalesData()

// // console.log(salesData)
//     res.render("dashboard", {
//       revenue: totalRevenue,
//       totalOrders,
//       productsCount,
//       totalDiscount,
//       salesData,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports = { loadDashboard };
