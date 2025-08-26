import React, { useEffect, useState } from "react";
import { Button, Popconfirm, message, Input, Tag } from "antd";
import MainTable from "./MainTable";
import { getAllOrders, deleteOrder } from "../../services/api";

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getAllOrders();
        const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date (desc)
        setOrders(sortedData);
        setFilteredOrders(sortedData);
      } catch (error) {
        setIsError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await deleteOrder(id);
      message.success("Pesanan berhasil dihapus!");
      setOrders((prev) => prev.filter((order) => order.id !== id));
      setFilteredOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (error) {
      message.error(error.message);
      setIsError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  
    setFilteredOrders(
      orders.filter((order) => {
        return (
          order.item_name.toLowerCase().includes(value) ||
          order.order_id.toLowerCase().includes(value) ||
          order.Licenses.some((license) =>
            license.license_key.toLowerCase().includes(value)
          )
        );
      })
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {isError}</div>;

  const columns = [
    { title: "Nomor Pesanan Shopee", dataIndex: "order_id", key: "order_id" },
    { title: "Nama Produk", dataIndex: "item_name", key: "item_name" },
    { title: "Variasi¹", dataIndex: "os", key: "os" },
    { title: "Variasi²", dataIndex: "version", key: "version" },
    {
      title: "Jumlah Pembelian",
      key: "license_count",
      render: (_, record) => record?.license_count,
    },
    {
      title: "Tanggal Order",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      defaultSortOrder: "ascend",
      render: (createdAt) => new Date(createdAt).toLocaleString(),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Popconfirm title="Yakin ingin menghapus?" onConfirm={() => handleDelete(record.id)}>
          <Button danger loading={isLoading}>Hapus</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Input
        placeholder="Cari Nomor Pesanan,Nama Produk atau Stok..."
        value={searchText}
        onChange={handleSearch}
        style={{ marginBottom: 16, width: 300 }}
      />
      <MainTable data={filteredOrders} columns={columns} btnAdd={false} expand={true} />
    </div>
  );
};

export default OrderTable;