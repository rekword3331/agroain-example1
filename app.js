import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ScrollView,
  TouchableOpacity
} from 'react-native';

// Simple ID Generator (Production apps should use libraries like uuid)
let nextId = 1; 

// --- 1. Product Management Components ---
// ----------------------------------------

const AddProduct = ({ onAddProduct, message }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('dawai'); // Default to dawai
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  // Dawai specific details
  const [dawaiType, setDawaiType] = useState('');
  const [technicalName, setTechnicalName] = useState('');
  const [volumeML, setVolumeML] = useState('');
  const [dawaiDetails, setDawaiDetails] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !quantity.trim() || isNaN(parseInt(quantity)) || !price.trim() || isNaN(parseFloat(price))) {
      Alert.alert("Input Error", "Please enter a valid product name, quantity, and numerical price.");
      return;
    }
    
    const productData = {
        name: name.trim(),
        category: category,
        quantity: parseInt(quantity),
        price: parseFloat(price),
    };

    if (category === 'dawai') {
        productData.dawaiDetails = {
            type: dawaiType,
            technical: technicalName,
            volume: volumeML,
            details: dawaiDetails
        };
    } else {
        productData.dawaiDetails = null;
    }

    onAddProduct(productData); 
    
    // Reset form
    setName('');
    setQuantity('');
    setPrice('');
    setDawaiType('');
    setTechnicalName('');
    setVolumeML('');
    setDawaiDetails('');
  };

  const dawaiTypes = ["बीज उपचार", "Harbiside", "Insecticide", "Fungicide", "Plant Growth", "Chopko"];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>➕ Add New Product</Text>
      
      {message ? <Text style={styles.message}>{message}</Text> : null}
      
      <TextInput style={styles.input} placeholder="Product Name" value={name} onChangeText={setName} />
      
      <View style={styles.row}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryPicker}>
            <Button title="Dawai" onPress={() => setCategory('dawai')} color={category === 'dawai' ? '#2e7d32' : '#9e9e9e'} />
            <Button title="Hardware" onPress={() => setCategory('hardware')} color={category === 'hardware' ? '#ff9800' : '#9e9e9e'} />
          </View>
        </View>
      </View>

      {category === 'dawai' && (
        <View style={styles.dawaiFieldsContainer}>
          <Text style={styles.dawaiTitle}>Dawai Details (दवाई विवरण)</Text>
          
          <View style={styles.row}>
             <View style={styles.formGroup}>
                <Text style={styles.label}>Type Dawai</Text>
                {/* Simplified Picker/Dropdown logic using Buttons for demonstration */}
                 <ScrollView horizontal style={{maxHeight: 40}}>
                    {dawaiTypes.map((type) => (
                        <TouchableOpacity 
                            key={type}
                            onPress={() => setDawaiType(type)}
                            style={[styles.smallButton, {backgroundColor: dawaiType === type ? '#60ad5e' : '#e0e0e0'}]}
                        >
                            <Text style={{color: dawaiType === type ? 'white' : '#333'}}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                 </ScrollView>
             </View>
          </View>
          
          <TextInput style={styles.input} placeholder="Technical Name" value={technicalName} onChangeText={setTechnicalName} />
          <TextInput style={styles.input} placeholder="Volume / Weight (ML/KG)" value={volumeML} onChangeText={setVolumeML} />
          <TextInput style={styles.input} placeholder="Usage, Crop, Target Pest/Disease, etc." value={dawaiDetails} onChangeText={setDawaiDetails} multiline numberOfLines={3} />
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.formGroup}>
          <TextInput style={styles.input} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>
        <View style={styles.formGroup}>
          <TextInput style={styles.input} placeholder="Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        </View>
      </View>
      <Button title="Add Product" onPress={handleSubmit} color="#2e7d32" />
    </View>
  );
};

const ProductItem = ({ product, onDelete }) => (
  <View style={styles.listItem}>
    <View style={styles.itemContent}>
      <Text style={styles.itemName}>
        {product.name} 
        <Text style={styles.categoryBadge(product.category)}> ({product.category})</Text>
      </Text>
      <Text style={styles.itemDetails}>Qty: {product.quantity} | Price: ₹{product.price.toFixed(2)}</Text>
    </View>
    <Button title="Delete" onPress={() => onDelete(product.id)} color="#f44336" />
  </View>
);

const ProductList = ({ products, onDeleteProduct }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Product Inventory ({products.length})</Text>
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <ProductItem product={item} onDelete={onDeleteProduct} />}
      ListEmptyComponent={() => <Text style={styles.emptyText}>No products found</Text>}
    />
  </View>
);


// --- 2. Customer Management Components ---
// -----------------------------------------

const AddCustomer = ({ onAddCustomer, message }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const handleSubmit = () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert("Input Error", "Customer name and phone number are required.");
            return;
        }

        onAddCustomer({ name: name.trim(), phone: phone.trim(), address: address.trim() });
        
        // Reset form
        setName('');
        setPhone('');
        setAddress('');
    };

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>➕ Add New Customer</Text>
            
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <TextInput style={styles.input} placeholder="Customer Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Address (Optional)" value={address} onChangeText={setAddress} multiline numberOfLines={3} />
            
            <Button title="Add Customer" onPress={handleSubmit} color="#007AFF" />
        </View>
    );
};

const CustomerItem = ({ customer, onDelete }) => (
    <View style={styles.listItem}>
        <View style={styles.itemContent}>
            <Text style={styles.itemName}>{customer.name}</Text>
            <Text style={styles.itemDetails}>
                Phone: {customer.phone} | Credit: ₹{customer.creditAmount.toFixed(2)}
                {customer.address ? `\nAddress: ${customer.address}` : ''}
            </Text>
        </View>
        <Button title="Delete" onPress={() => onDelete(customer.id)} color="#f44336" />
    </View>
);

const CustomerList = ({ customers, onDeleteCustomer }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer List ({customers.length})</Text>
        <FlatList
            data={customers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CustomerItem customer={item} onDelete={onDeleteCustomer} />}
            ListEmptyComponent={() => <Text style={styles.emptyText}>No customers found</Text>}
        />
    </View>
);

// --- 3. Main App Component ---
// -----------------------------

export default function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [productMessage, setProductMessage] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');

  // Load data from storage (using a simple placeholder here as AsyncStorage is not available)
  // In a real RN app, you would use AsyncStorage/Redux for persistence
  useEffect(() => {
    // Initial data load simulation
    // Since we can't use localStorage in RN, we'll start with empty data.
  }, []);

  const handleAddProduct = (newProductData) => {
    const newProduct = {
      id: (nextId++).toString(), 
      ...newProductData,
      dawaiDetails: newProductData.dawaiDetails,
    };

    setProducts(prevProducts => [...prevProducts, newProduct]);
    setProductMessage(`✅ Product "${newProduct.name}" added successfully!`);
    setTimeout(() => setProductMessage(''), 3000);
  };
  
  const handleDeleteProduct = (id) => {
    Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this product?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", onPress: () => {
                setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
                setProductMessage('Product deleted successfully!');
                setTimeout(() => setProductMessage(''), 3000);
            }, style: "destructive" }
        ]
    );
  };

  const handleAddCustomer = (newCustomerData) => {
    const newCustomer = {
      id: (nextId++).toString(),
      ...newCustomerData,
      creditAmount: 0.00, // Starting credit is zero
    };

    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
    setCustomerMessage(`✅ Customer "${newCustomer.name}" added successfully!`);
    setTimeout(() => setCustomerMessage(''), 3000);
  };

  const handleDeleteCustomer = (id) => {
    const customer = customers.find(c => c.id === id);
    if (customer && customer.creditAmount > 0) {
        Alert.alert("Cannot Delete", "Customer has an outstanding credit! Settle the credit first.");
        return;
    }
    
    Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this customer?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", onPress: () => {
                setCustomers(prevCustomers => prevProducts.filter(c => c.id !== id));
                setCustomerMessage('Customer deleted successfully!');
                setTimeout(() => setCustomerMessage(''), 3000);
            }, style: "destructive" }
        ]
    );
  };

  const totalPending = customers.reduce((sum, customer) => sum + customer.creditAmount, 0);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header and Tabs */}
        <View style={styles.header}>
            <Text style={styles.title}>🌾 Agroain Shop Management</Text>
        </View>

        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'inventory' && styles.tabActive]} 
                onPress={() => setActiveTab('inventory')}
            >
                <Text style={activeTab === 'inventory' ? styles.tabTextActive : styles.tabText}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'customers' && styles.tabActive]} 
                onPress={() => setActiveTab('customers')}
            >
                <Text style={activeTab === 'customers' ? styles.tabTextActive : styles.tabText}>Customers</Text>
            </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statLabel}>Products</Text><Text style={styles.statValue}>{products.length}</Text></View>
            <View style={styles.statCard}><Text style={styles.statLabel}>Customers</Text><Text style={styles.statValue}>{customers.length}</Text></View>
            <View style={[styles.statCard, {backgroundColor: '#ffc947'}]}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statValue, {color: '#c66900'}]}>₹{totalPending.toFixed(2)}</Text>
            </View>
        </View>
        
        <ScrollView style={styles.content}>
        
            {/* Inventory Tab Content */}
            {activeTab === 'inventory' && (
                <View>
                    <AddProduct onAddProduct={handleAddProduct} message={productMessage} />
                    <View style={styles.separator} />
                    <ProductList products={products} onDeleteProduct={handleDeleteProduct} />
                </View>
            )}

            {/* Customers Tab Content */}
            {activeTab === 'customers' && (
                <View>
                    <AddCustomer onAddCustomer={handleAddCustomer} message={customerMessage} />
                    <View style={styles.separator} />
                    <CustomerList customers={customers} onDeleteCustomer={handleDeleteCustomer} />
                </View>
            )}

            {/* Bill Book (Placeholder - too complex for simple conversion) */}
            {activeTab === 'createBill' && (
                 <Text style={styles.placeholderText}>Bill Book functionality is complex and requires advanced state management/PDF libraries in React Native. It is currently disabled.</Text>
            )}

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Global Styles
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  safeArea: { flex: 1, padding: 10 },
  header: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 8, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: 'white' },
  message: { fontSize: 14, color: '#388e3c', textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  separator: { height: 10 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2e7d32' },
  input: { height: 45, borderColor: '#ddd', borderWidth: 1, borderRadius: 4, paddingHorizontal: 15, marginBottom: 12, backgroundColor: '#fafafa', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  formGroup: { flex: 1 },
  label: { marginBottom: 5, fontWeight: '500', color: '#333' },
  content: { flex: 1, paddingTop: 5 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  
  // Tab Styles
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { paddingVertical: 10, flex: 1, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#2e7d32' },
  tabText: { color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#2e7d32', fontWeight: 'bold' },
  
  // Stats Styles
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 5 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 1 },
  statLabel: { fontSize: 12, color: '#666' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginTop: 3 },

  // List Item Styles (for Products and Customers)
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemContent: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemDetails: { fontSize: 13, color: '#666', marginTop: 2 },
  
  // Dawai Specific Styles
  dawaiFieldsContainer: { padding: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#60ad5e', borderRadius: 4, marginBottom: 15, backgroundColor: '#f9fff9' },
  dawaiTitle: { fontSize: 16, fontWeight: 'bold', color: '#005005', marginBottom: 10 },
  categoryPicker: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
  smallButton: { padding: 8, marginHorizontal: 3, borderRadius: 4 },
  categoryBadge: (category) => ({
    fontSize: 12,
    color: category === 'dawai' ? '#005005' : '#c66900',
    fontWeight: 'normal',
  }),
  placeholderText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
    padding: 20,
  }
});

