/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Ruleta;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.sql.ResultSet;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.swing.JOptionPane;
import javax.swing.JViewport;
import javax.swing.Timer;
import javax.swing.UIManager;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableColumn;
import javax.swing.table.TableColumnModel;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import net.sf.jasperreports.view.JasperViewer;

/**
 *
 * @author DESINCO
 */
public class FrmDRealizarJuego extends javax.swing.JDialog {

    Conexion ConeBD =  new Conexion();
    
    int Ingreso = 0, Consecu = 0;
    
    DefaultTableModel DatosLotto;
    String DatLotto[] =  new String[4];
    
    DefaultTableModel DatosHorarioLotto;
    String DatHorarioLotto[] =  new String[4];
    
    DefaultTableModel DatosJugar;
    String DatJugar[] =  new String[6];
    
    Timer Tiempo;
    java.util.Date Reloj;
    SimpleDateFormat Formato;
    
    DecimalFormat Convertir = new DecimalFormat("###,###.##"); 
    
    double ValTJugar = 0, Minimo = 0, Maximo = 0;
    String HoraJuego = "";
    
    public FrmDRealizarJuego(java.awt.Frame parent, boolean modal) {
        super(parent, modal);
        try
        {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());            
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }
        initComponents();
        this.setLocationRelativeTo(this);
        TxtCodigoA.requestFocus();
    }

    void MostrarHora()
    {
        Formato = new SimpleDateFormat("HH:mm:ss");
        Tiempo = new Timer(1000, new ActionListener() 
        {
            public void actionPerformed(ActionEvent evt)
            {
                Reloj = new java.util.Date();
                JlHora.setText(Formato.format(Reloj));
            }
        });
        Tiempo.start();
    }
    
    public void Mostrar(String Sucursal, Date FechaHTTP)
    {
//        SimpleDateFormat F = new SimpleDateFormat("yyyy-MM-dd");
//        java.util.Date Fecha = new java.util.Date();
        FechaJuego.setDate(FechaHTTP);
        
        JlSucursal.setText(Sucursal);
        MostrarHora();
    }
    
    void ParametroMinimoJ()
    {
        String SqlParMinimo = "";
        
        try
        {
            SqlParMinimo = "SELECT VALOR FROM PARAMETROS WHERE CODIGO = 3";
            ConeBD.RstBD = (ResultSet) ConeBD.StmBD.executeQuery(SqlParMinimo);
            if (ConeBD.RstBD.next())
            {
                Minimo = Double.parseDouble(ConeBD.RstBD.getString("VALOR"));
            }                    
        }
        catch (Exception err)
        {
            
        }
    }
    
    void ParametroMaximoJ()
    {
        String SqlParMaximo = "";
        
        try
        {
            SqlParMaximo = "SELECT VALOR FROM PARAMETROS WHERE CODIGO = 2";
            ConeBD.RstBD = (ResultSet) ConeBD.StmBD.executeQuery(SqlParMaximo);
            if (ConeBD.RstBD.next())
            {
                Maximo = Double.parseDouble(ConeBD.RstBD.getString("VALOR"));
            }                    
        }
        catch (Exception err)
        {
            
        }
    }
    
    void Limpiar()
    {
        TxtCodA.setText("");
        TxtCodigoA.setText("");
        TxtCodigoH.setText("");
        TxtAnimal.setText("");
        TxtValorJ.setText("");
        TxtHoraJuego.setText("");
        TxtCodigoA.requestFocus();
    }
    
    void CargarTabla()
    {
        TablaJugar.clearSelection();
        DatosJugar =  new DefaultTableModel();
        TablaJugar.setModel(DatosJugar);
        DatosJugar.addColumn("Número");
        DatosJugar.addColumn("Animal");
        DatosJugar.addColumn("Codigo");
        DatosJugar.addColumn("Descipción del Juego");
        DatosJugar.addColumn("Hora");
        DatosJugar.addColumn("Valor Lotto $");
        
        int anchoColumna1 = 0;
        JViewport scroll1 =  (JViewport) TablaJugar.getParent();
        int ancho1 = scroll1.getWidth();
        TableColumnModel modeloColumna1 = TablaJugar.getColumnModel();
        TableColumn columnaTabla1;                
        for (int j = 0; j < TablaJugar.getColumnCount(); j++)
        {
            columnaTabla1 = modeloColumna1.getColumn(j);
            switch(j)
            {
                case 0: anchoColumna1 = (15*ancho1)/100;
                    break;
                case 1: anchoColumna1 = (15*ancho1)/100;
                    break;
                case 2: anchoColumna1 = (15*ancho1)/100;
                    break;
                case 3: anchoColumna1 = (80*ancho1)/100;
                    break;
                case 4: anchoColumna1 = (15*ancho1)/100;
                    break;
                case 5: anchoColumna1 = (15*ancho1)/100;
                    break;
            }
            columnaTabla1.setPreferredWidth(anchoColumna1);
        }
    }
    
    void MostrarTablaJuegos()
    {
        String SqlMostrarTabla = "";
        TablaHorario.clearSelection();
        DatosHorarioLotto =  new DefaultTableModel();
        TablaHorario.setModel(DatosHorarioLotto);
        
        DatosHorarioLotto.addColumn("Codigo");
        DatosHorarioLotto.addColumn("Des. Juego");
        DatosHorarioLotto.addColumn("Hota Juego");
        
        try
        {
            //SqlMostrarTabla = "SELECT * FROM horariojuego WHERE (HORA < '"+JlHora.getText()+"') AND ESTADO = 'A' ORDER BY NUM";
            SqlMostrarTabla = "SELECT * FROM horariojuego WHERE ESTADO = 'A' ORDER BY NUM";
            System.out.println(SqlMostrarTabla);
            ConeBD.RstBD = (ResultSet) ConeBD.StmBD.executeQuery(SqlMostrarTabla);
            while (ConeBD.RstBD.next())
            {
                DatHorarioLotto[0] = String.valueOf(ConeBD.RstBD.getInt("NUM"));
                DatHorarioLotto[1] = ConeBD.RstBD.getString("DESCRIPCION");
                DatHorarioLotto[2] = String.valueOf(ConeBD.RstBD.getTime("HORA"));
                DatosHorarioLotto.addRow(DatHorarioLotto);
                
                int anchoColumna1 = 0;
                JViewport scroll1 =  (JViewport) TablaHorario.getParent();
                int ancho1 = scroll1.getWidth();
                TableColumnModel modeloColumna1 = TablaHorario.getColumnModel();
                TableColumn columnaTabla1;                
                for (int j = 0; j < TablaHorario.getColumnCount(); j++)
                {
                    columnaTabla1 = modeloColumna1.getColumn(j);
                    switch(j)
                    {
                        case 0: anchoColumna1 = (15*ancho1)/100;
                            break;
                        case 1: anchoColumna1 = (80*ancho1)/100;
                            break;
                        case 2: anchoColumna1 = (30*ancho1)/100;
                            break;
                    }
                    columnaTabla1.setPreferredWidth(anchoColumna1);
                }
                
            }
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }        
    }
    
    void MostrarTabla()
    {
        String SqlMostrarTabla = "";
        TablaRuleta.clearSelection();
        DatosLotto =  new DefaultTableModel();
        TablaRuleta.setModel(DatosLotto);
        
        DatosLotto.addColumn("Codigo");
        DatosLotto.addColumn("#");
        DatosLotto.addColumn("Animal");
        DatosLotto.addColumn("Color");
        
        try
        {
            SqlMostrarTabla = "SELECT * FROM lottoruleta WHERE ESTADO = 'A' ORDER BY NUM";
            ConeBD.RstBD = (ResultSet) ConeBD.StmBD.executeQuery(SqlMostrarTabla);
            while (ConeBD.RstBD.next())
            {
                DatLotto[0] = String.valueOf(ConeBD.RstBD.getInt("NUM"));
                DatLotto[1] = ConeBD.RstBD.getString("CODIGOJUEGO");
                DatLotto[2] = ConeBD.RstBD.getString("VALOR");
                DatLotto[3] = ConeBD.RstBD.getString("COLOR");
                TablaRuleta.setDefaultRenderer(Object.class,new Render());
                DatosLotto.addRow(DatLotto);
                
                int anchoColumna1 = 0;
                JViewport scroll1 =  (JViewport) TablaRuleta.getParent();
                int ancho1 = scroll1.getWidth();
                TableColumnModel modeloColumna1 = TablaRuleta.getColumnModel();
                TableColumn columnaTabla1;                
                for (int j = 0; j < TablaRuleta.getColumnCount(); j++)
                {
                    columnaTabla1 = modeloColumna1.getColumn(j);
                    switch(j)
                    {
                        case 0: anchoColumna1 = (15*ancho1)/100;
                            break;
                        case 1: anchoColumna1 = (15*ancho1)/100;
                            break;
                        case 2: anchoColumna1 = (50*ancho1)/100;
                            break;
                        case 3: anchoColumna1 = (15*ancho1)/100;
                            break;
                    }
                    columnaTabla1.setPreferredWidth(anchoColumna1);
                }
                
            }
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }
        
    }
    
    
    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jPanel1 = new javax.swing.JPanel();
        jScrollPane1 = new javax.swing.JScrollPane();
        TablaRuleta = new javax.swing.JTable();
        jPanel2 = new javax.swing.JPanel();
        jLabel4 = new javax.swing.JLabel();
        JlSucursal = new javax.swing.JLabel();
        JlHora = new javax.swing.JLabel();
        FechaJuego = new com.toedter.calendar.JDateChooser();
        jPanel3 = new javax.swing.JPanel();
        jLabel1 = new javax.swing.JLabel();
        TxtRadicado = new javax.swing.JTextField();
        jLabel2 = new javax.swing.JLabel();
        TxtCodA = new javax.swing.JTextField();
        TxtAnimal = new javax.swing.JTextField();
        jLabel3 = new javax.swing.JLabel();
        TxtValorJ = new javax.swing.JTextField();
        jScrollPane2 = new javax.swing.JScrollPane();
        TablaHorario = new javax.swing.JTable();
        jLabel5 = new javax.swing.JLabel();
        TxtCodigoA = new javax.swing.JTextField();
        TxtHoraJuego = new javax.swing.JTextField();
        TxtCodigoH = new javax.swing.JTextField();
        jPanel4 = new javax.swing.JPanel();
        jButton1 = new javax.swing.JButton();
        jButton2 = new javax.swing.JButton();
        jButton3 = new javax.swing.JButton();
        jButton4 = new javax.swing.JButton();
        jButton5 = new javax.swing.JButton();
        jButton6 = new javax.swing.JButton();
        jScrollPane3 = new javax.swing.JScrollPane();
        TablaJugar = new javax.swing.JTable();
        jPanel5 = new javax.swing.JPanel();
        jLabel6 = new javax.swing.JLabel();
        TxtTotalJ = new javax.swing.JTextField();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        addWindowListener(new java.awt.event.WindowAdapter() {
            public void windowOpened(java.awt.event.WindowEvent evt) {
                formWindowOpened(evt);
            }
        });

        jPanel1.setBackground(new java.awt.Color(255, 255, 255));
        jPanel1.setBorder(javax.swing.BorderFactory.createMatteBorder(1, 3, 1, 3, new java.awt.Color(0, 0, 0)));

        TablaRuleta.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        TablaRuleta.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {},
                {},
                {},
                {}
            },
            new String [] {

            }
        ));
        TablaRuleta.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        TablaRuleta.setRowHeight(30);
        TablaRuleta.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                TablaRuletaMouseClicked(evt);
            }
        });
        jScrollPane1.setViewportView(TablaRuleta);

        jLabel4.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jLabel4.setText("Sucursal:");

        JlSucursal.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        JlSucursal.setText(".");

        JlHora.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        JlHora.setHorizontalAlignment(javax.swing.SwingConstants.CENTER);
        JlHora.setText("00:00:00");

        FechaJuego.setEnabled(false);
        FechaJuego.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N

        javax.swing.GroupLayout jPanel2Layout = new javax.swing.GroupLayout(jPanel2);
        jPanel2.setLayout(jPanel2Layout);
        jPanel2Layout.setHorizontalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabel4)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(JlSucursal, javax.swing.GroupLayout.PREFERRED_SIZE, 314, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(FechaJuego, javax.swing.GroupLayout.PREFERRED_SIZE, 107, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(JlHora, javax.swing.GroupLayout.PREFERRED_SIZE, 72, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
        );
        jPanel2Layout.setVerticalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(JlSucursal, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addComponent(JlHora, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addGroup(jPanel2Layout.createSequentialGroup()
                        .addComponent(FechaJuego, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(0, 2, Short.MAX_VALUE))
                    .addComponent(jLabel4, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                .addContainerGap())
        );

        jPanel3.setBackground(new java.awt.Color(255, 255, 255));

        jLabel1.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jLabel1.setText("Radicado de Juego:");

        TxtRadicado.setEditable(false);
        TxtRadicado.setFont(new java.awt.Font("Tahoma", 0, 14)); // NOI18N

        jLabel2.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jLabel2.setText("Animalito:");

        TxtCodA.setEditable(false);
        TxtCodA.setFont(new java.awt.Font("Tahoma", 0, 14)); // NOI18N
        TxtCodA.setHorizontalAlignment(javax.swing.JTextField.CENTER);

        TxtAnimal.setEditable(false);
        TxtAnimal.setFont(new java.awt.Font("Tahoma", 0, 14)); // NOI18N

        jLabel3.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jLabel3.setText("Monto Bs: $");

        TxtValorJ.setFont(new java.awt.Font("Tahoma", 0, 24)); // NOI18N
        TxtValorJ.setHorizontalAlignment(javax.swing.JTextField.CENTER);
        TxtValorJ.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyReleased(java.awt.event.KeyEvent evt) {
                TxtValorJKeyReleased(evt);
            }
            public void keyPressed(java.awt.event.KeyEvent evt) {
                TxtValorJKeyPressed(evt);
            }
            public void keyTyped(java.awt.event.KeyEvent evt) {
                TxtValorJKeyTyped(evt);
            }
        });

        TablaHorario.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        TablaHorario.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {},
                {},
                {},
                {}
            },
            new String [] {

            }
        ));
        TablaHorario.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        TablaHorario.setRowHeight(25);
        TablaHorario.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                TablaHorarioMouseClicked(evt);
            }
        });
        jScrollPane2.setViewportView(TablaHorario);

        jLabel5.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jLabel5.setText("Codigo:");

        TxtCodigoA.setFont(new java.awt.Font("Tahoma", 0, 18)); // NOI18N
        TxtCodigoA.setHorizontalAlignment(javax.swing.JTextField.CENTER);
        TxtCodigoA.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyPressed(java.awt.event.KeyEvent evt) {
                TxtCodigoAKeyPressed(evt);
            }
        });

        TxtHoraJuego.setEditable(false);
        TxtHoraJuego.setFont(new java.awt.Font("Tahoma", 0, 24)); // NOI18N
        TxtHoraJuego.setHorizontalAlignment(javax.swing.JTextField.CENTER);

        TxtCodigoH.setEditable(false);
        TxtCodigoH.setFont(new java.awt.Font("Tahoma", 0, 24)); // NOI18N
        TxtCodigoH.setHorizontalAlignment(javax.swing.JTextField.CENTER);

        javax.swing.GroupLayout jPanel3Layout = new javax.swing.GroupLayout(jPanel3);
        jPanel3.setLayout(jPanel3Layout);
        jPanel3Layout.setHorizontalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel3Layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel1)
                    .addComponent(jLabel2)
                    .addComponent(jLabel3)
                    .addComponent(jLabel5))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                    .addComponent(TxtRadicado, javax.swing.GroupLayout.PREFERRED_SIZE, 124, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addGroup(jPanel3Layout.createSequentialGroup()
                        .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                            .addComponent(TxtCodA, javax.swing.GroupLayout.DEFAULT_SIZE, 59, Short.MAX_VALUE)
                            .addComponent(TxtCodigoA))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(TxtAnimal, javax.swing.GroupLayout.PREFERRED_SIZE, 212, javax.swing.GroupLayout.PREFERRED_SIZE))
                    .addGroup(jPanel3Layout.createSequentialGroup()
                        .addComponent(TxtValorJ, javax.swing.GroupLayout.PREFERRED_SIZE, 197, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(TxtCodigoH)))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(TxtHoraJuego)
                    .addComponent(jScrollPane2, javax.swing.GroupLayout.DEFAULT_SIZE, 503, Short.MAX_VALUE))
                .addContainerGap())
        );
        jPanel3Layout.setVerticalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel3Layout.createSequentialGroup()
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(jScrollPane2, javax.swing.GroupLayout.Alignment.LEADING, javax.swing.GroupLayout.PREFERRED_SIZE, 0, Short.MAX_VALUE)
                    .addGroup(jPanel3Layout.createSequentialGroup()
                        .addContainerGap()
                        .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                            .addComponent(TxtRadicado)
                            .addComponent(jLabel1, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(TxtCodigoA)
                            .addComponent(jLabel5, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel2, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                                .addComponent(TxtCodA, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addComponent(TxtAnimal, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)))))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                    .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                        .addComponent(TxtValorJ)
                        .addComponent(TxtHoraJuego))
                    .addComponent(jLabel3, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addComponent(TxtCodigoH))
                .addContainerGap())
        );

        jButton1.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jButton1.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Img/Iconos/IconV/iconfinder_document_1055071.png"))); // NOI18N
        jButton1.setText("Nuevo");
        jButton1.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        jButton1.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButton1ActionPerformed(evt);
            }
        });

        jButton2.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jButton2.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Botones_1/iconfinder_Cheque_5580232.png"))); // NOI18N
        jButton2.setText("Guardar");
        jButton2.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        jButton2.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButton2ActionPerformed(evt);
            }
        });

        jButton3.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jButton3.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Img/Iconos/IconV/iconfinder_file-download_326639.png"))); // NOI18N
        jButton3.setText("Agregar");
        jButton3.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        jButton3.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButton3ActionPerformed(evt);
            }
        });

        jButton4.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        jButton4.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Img/Iconos/IconV/if_wallet_1296367.png"))); // NOI18N
        jButton4.setText("Ver Juegos");
        jButton4.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));

        jButton5.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Botones_1/iconfinder_-_Trash-Can-Delete-Remove-_3844394.png"))); // NOI18N
        jButton5.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));

        jButton6.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Img/Iconos/IconV/if_money_299107.png"))); // NOI18N
        jButton6.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));

        javax.swing.GroupLayout jPanel4Layout = new javax.swing.GroupLayout(jPanel4);
        jPanel4.setLayout(jPanel4Layout);
        jPanel4Layout.setHorizontalGroup(
            jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel4Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jButton1)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jButton2, javax.swing.GroupLayout.PREFERRED_SIZE, 113, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jButton3)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jButton4)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 295, Short.MAX_VALUE)
                .addComponent(jButton6)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jButton5)
                .addContainerGap())
        );
        jPanel4Layout.setVerticalGroup(
            jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(jButton1, javax.swing.GroupLayout.DEFAULT_SIZE, 44, Short.MAX_VALUE)
            .addComponent(jButton2, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
            .addComponent(jButton3, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
            .addComponent(jButton5, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
            .addComponent(jButton6, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
            .addComponent(jButton4, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
        );

        TablaJugar.setFont(new java.awt.Font("Tahoma", 0, 12)); // NOI18N
        TablaJugar.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {},
                {},
                {},
                {}
            },
            new String [] {

            }
        ));
        TablaJugar.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        TablaJugar.setRowHeight(30);
        jScrollPane3.setViewportView(TablaJugar);

        jPanel5.setBackground(new java.awt.Color(255, 255, 255));

        jLabel6.setFont(new java.awt.Font("Tahoma", 0, 24)); // NOI18N
        jLabel6.setText("Total del Juego : $");

        TxtTotalJ.setEditable(false);
        TxtTotalJ.setFont(new java.awt.Font("Tahoma", 0, 24)); // NOI18N
        TxtTotalJ.setHorizontalAlignment(javax.swing.JTextField.CENTER);
        TxtTotalJ.setText("0.0");

        javax.swing.GroupLayout jPanel5Layout = new javax.swing.GroupLayout(jPanel5);
        jPanel5.setLayout(jPanel5Layout);
        jPanel5Layout.setHorizontalGroup(
            jPanel5Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel5Layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(jLabel6)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(TxtTotalJ, javax.swing.GroupLayout.PREFERRED_SIZE, 254, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
        );
        jPanel5Layout.setVerticalGroup(
            jPanel5Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel5Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                .addComponent(TxtTotalJ, javax.swing.GroupLayout.DEFAULT_SIZE, 37, Short.MAX_VALUE)
                .addComponent(jLabel6, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        javax.swing.GroupLayout jPanel1Layout = new javax.swing.GroupLayout(jPanel1);
        jPanel1.setLayout(jPanel1Layout);
        jPanel1Layout.setHorizontalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addComponent(jScrollPane1, javax.swing.GroupLayout.PREFERRED_SIZE, 283, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jPanel2, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addComponent(jPanel3, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addComponent(jPanel4, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addComponent(jScrollPane3)
                    .addComponent(jPanel5, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)))
        );
        jPanel1Layout.setVerticalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(jScrollPane1, javax.swing.GroupLayout.DEFAULT_SIZE, 622, Short.MAX_VALUE)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addComponent(jPanel2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jPanel3, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jPanel4, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jScrollPane3, javax.swing.GroupLayout.PREFERRED_SIZE, 0, Short.MAX_VALUE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jPanel5, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
        );

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(jPanel1, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addComponent(jPanel1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(0, 0, Short.MAX_VALUE))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void formWindowOpened(java.awt.event.WindowEvent evt) {//GEN-FIRST:event_formWindowOpened
        
        ConeBD.Coneccion_BD();
        ConsecutivoRadicado();
        ParametroMaximoJ();
        ParametroMinimoJ();
        MostrarTabla();
        MostrarTablaJuegos();
        CargarTabla();
    }//GEN-LAST:event_formWindowOpened

    private void TablaRuletaMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_TablaRuletaMouseClicked
        
        int Fila = TablaRuleta.getSelectedRow();
        int Columna0 = 0, Columna1 = 1, Columna2 = 2, Columna3 = 3;  
        
        
        TxtCodigoA.setText((String.valueOf(this.TablaRuleta.getValueAt(Fila, Columna1))));
        TxtCodA.setText((String.valueOf(this.TablaRuleta.getValueAt(Fila, Columna1))));
        TxtAnimal.setText((String.valueOf(this.TablaRuleta.getValueAt(Fila, Columna2))));
        
        TxtValorJ.requestFocus();
    }//GEN-LAST:event_TablaRuletaMouseClicked

    private void TablaHorarioMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_TablaHorarioMouseClicked
        
        int Fila = TablaHorario.getSelectedRow();
        int Columna0 = 0, Columna1 = 1, Columna2 = 2, Columna3 = 3;  
        
        TxtCodigoH.setText((String.valueOf(this.TablaHorario.getValueAt(Fila, Columna0))));
        TxtHoraJuego.setText((String.valueOf(this.TablaHorario.getValueAt(Fila, Columna1))));
        HoraJuego = (String.valueOf(this.TablaHorario.getValueAt(Fila, Columna2)));
        
        jButton3.requestFocus();
    }//GEN-LAST:event_TablaHorarioMouseClicked

    void BuscarAnimal(String CodigoA)
    {
        String SqlBuscarA = "";
        
        try
        {
            SqlBuscarA = "SELECT CODIGOJUEGO, VALOR FROM lottoruleta WHERE CODIGOJUEGO = '"+CodigoA+"'";
            ConeBD.RstBD = (ResultSet) ConeBD.StmBD.executeQuery(SqlBuscarA);
            if (ConeBD.RstBD.next())
            {
                TxtCodA.setText(ConeBD.RstBD.getString("CODIGOJUEGO"));
                TxtAnimal.setText(ConeBD.RstBD.getString("VALOR"));
                TxtValorJ.requestFocus();
            }
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }
    }
    
    private void TxtCodigoAKeyPressed(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_TxtCodigoAKeyPressed
        
        if (evt.getKeyChar() == KeyEvent.VK_ENTER) 
        {
            if (!(TxtCodigoA.getText().equals("")))
            {
                BuscarAnimal(TxtCodigoA.getText());
            }
            else
            {
                JOptionPane.showMessageDialog(null, "Debe Ingresar un numero de Lotto Animal ...");
            }
            
        }
    }//GEN-LAST:event_TxtCodigoAKeyPressed

    private void TxtValorJKeyReleased(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_TxtValorJKeyReleased
        DecimalFormat df = new DecimalFormat("#,###");
        
        if (TxtValorJ.getText().length() >= 1) 
        {
            TxtValorJ.setText(df.format(Integer.valueOf(TxtValorJ.getText().replace(".", "").replace(",", ""))) );
        }
    }//GEN-LAST:event_TxtValorJKeyReleased

    private void TxtValorJKeyTyped(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_TxtValorJKeyTyped
        
        char c1 = evt.getKeyChar();
        if (c1 < '0' || c1 > '9') 
        {
            evt.consume();
        }
        if (TxtValorJ.getText().length() >= 10)
        {
            evt.consume();
        }
    }//GEN-LAST:event_TxtValorJKeyTyped

    private void TxtValorJKeyPressed(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_TxtValorJKeyPressed
        
        if (evt.getKeyChar() == KeyEvent.VK_ENTER) 
        {
            jButton3.requestFocus();
        }
    }//GEN-LAST:event_TxtValorJKeyPressed

    void AgregarJuego()
    {
        DatJugar[0] = TxtCodA.getText();
        DatJugar[1] = TxtAnimal.getText(); 
        DatJugar[2] = TxtCodigoH.getText();
        DatJugar[3] = TxtHoraJuego.getText();
        DatJugar[4] = HoraJuego;        
        DatJugar[5] = TxtValorJ.getText();
        DatosJugar.addRow(DatJugar);
        ValTJugar = ValTJugar + (Double.parseDouble(TxtValorJ.getText().replace(".", "")));
        TxtTotalJ.setText(String.valueOf(Convertir.format(ValTJugar)));
    }
    
    private void jButton3ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButton3ActionPerformed
        
        int OpcG = JOptionPane.showConfirmDialog(null, "¿Desea Ingresar el Juego de Lotto Animal ...?");
        if (OpcG == 0)
        {
            if (!(TxtHoraJuego.getText().equals("")))
            {
                if ((Double.parseDouble(TxtValorJ.getText().replace(".", ""))) >= Minimo)
                {
                    if ((Double.parseDouble(TxtValorJ.getText().replace(".", ""))) <= Maximo)
                    {
                        AgregarJuego();
                        Limpiar();
                    }
                    else
                    {
                        JOptionPane.showMessageDialog(null, "El Valor Ingresado es superios a la apuesta permitida ...");
                        TxtValorJ.requestFocus();
                    }
                }
                else
                {
                    JOptionPane.showMessageDialog(null, "El Valor Ingresado es Inferios a la apuesta permitida ...");
                     TxtValorJ.requestFocus();
                }
            }
            else
            {
                JOptionPane.showMessageDialog(null, "Debe Seleccionar un Horario de Juego de Lotto Animal ...");
                TablaHorario.requestFocus();
            }
        }
    }//GEN-LAST:event_jButton3ActionPerformed

    void ConsecutivoRadicado()
    {
        String SqlConsecutivo = "";
        try
        {
            SqlConsecutivo = "SELECT MAX(NUM) AS CONSECUTIVO FROM jugarlotto";
            System.out.println(SqlConsecutivo);
            ConeBD.RstBD = (ResultSet) ConeBD.StmBD.executeQuery(SqlConsecutivo);
            if (ConeBD.RstBD.next())
            {
                Consecu = ConeBD.RstBD.getInt("CONSECUTIVO") + 1;
            }
            if (String.valueOf(Consecu).length() == 1)
            {
               TxtRadicado.setText("0000000"+String.valueOf(Consecu));
            }
            else
            {
                if (String.valueOf(Consecu).length() == 2)
                {
                    TxtRadicado.setText("000000"+String.valueOf(Consecu));
                }
                else
                {
                    if (String.valueOf(Consecu).length() == 3)
                    {
                        TxtRadicado.setText("00000"+String.valueOf(Consecu));
                    }
                    else
                    {
                        if (String.valueOf(Consecu).length() == 4)
                        {
                            TxtRadicado.setText("0000"+String.valueOf(Consecu));
                        }
                        else
                        {
                            if (String.valueOf(Consecu).length() == 5)
                            {
                                TxtRadicado.setText("000"+String.valueOf(Consecu));
                            }
                            else
                            {
                                if (String.valueOf(Consecu).length() == 6)
                                {
                                    TxtRadicado.setText("00"+String.valueOf(Consecu));
                                }
                                else
                                {
                                    if (String.valueOf(Consecu).length() == 7)
                                    {
                                        TxtRadicado.setText("0"+String.valueOf(Consecu));
                                    }
                                    else
                                    {
                                        TxtRadicado.setText(String.valueOf(Consecu));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }
    }
    
    
    private void jButton1ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButton1ActionPerformed
        
        ConsecutivoRadicado();
    }//GEN-LAST:event_jButton1ActionPerformed

    void HisGuardar()
    {
        String SqlHisGuardar = "", Dat1 = "", Dat2 = "", Dat3 = "", Dat4 = "", Dat5 = "", Dat6 = "";
        
        java.util.Date fechaS = FechaJuego.getDate();
        SimpleDateFormat S = new SimpleDateFormat("yyyy-MM-dd");
        String FechaF = (S.format(fechaS)); 
        
        try
        {
            for (int x = 0;  x < TablaJugar.getRowCount(); x++)
            {
                Dat1 = (String.valueOf(this.TablaJugar.getValueAt(x, 0)));//CODIGO JUEGO
                Dat2 = (String.valueOf(this.TablaJugar.getValueAt(x, 1)));//ANIMAL
                Dat3 = (String.valueOf(this.TablaJugar.getValueAt(x, 2)));//CODIGO JUEGO
                Dat4 = (String.valueOf(this.TablaJugar.getValueAt(x, 3)));//DESCRIPCION JUEGO
                Dat5 = (String.valueOf(this.TablaJugar.getValueAt(x, 4)));//HORA JUEGO
                Dat6 = (String.valueOf(this.TablaJugar.getValueAt(x, 5)));//VALOR JUGADO
                
                SqlHisGuardar = "INSERT INTO hislottojuego VALUES ('"+TxtRadicado.getText()+"','"+Dat1+"','"+Dat2+"',"
                        + Dat6.replace(".", "")+","+Dat3+",'"+Dat5+"','"+Dat4+"','"+JlSucursal.getText()+"','"+FechaF+"','"+
                        JlHora.getText()+"','A','A')";
                System.out.println(SqlHisGuardar);
                ConeBD.StmBD.executeUpdate(SqlHisGuardar);
                
            }
            Imprimir();
            CargarTabla();
            ConsecutivoRadicado();            
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }
    }
    
    void Guardar()
    {
        String SqlGuardar = "";
        
        java.util.Date fechaS = FechaJuego.getDate();
        SimpleDateFormat S = new SimpleDateFormat("yyyy-MM-dd");
        String FechaF = (S.format(fechaS)); 
        
        try
        {
            SqlGuardar = "INSERT INTO jugarlotto VALUES ("+Consecu+",'"+TxtRadicado.getText()+"','"+FechaF+"','"+JlHora.getText()+"',"
                    + "'"+JlSucursal.getText()+"',"+TxtTotalJ.getText().replace(".", "")+",'"+JlSucursal.getText()+"','A')";
            System.out.println(SqlGuardar);
            ConeBD.StmBD.executeUpdate(SqlGuardar);
            HisGuardar();
        }
        catch (Exception err)
        {
            err.printStackTrace();
        }
    }
    
    void Imprimir()
    {
        try
            {
                JasperDesign dis = JRXmlLoader.load("C:/ReporteLotto/RptLottoJuego.jrxml");
                JasperReport des = JasperCompileManager.compileReport(dis);
                Map parametro = (Map) new HashMap();
                parametro.put("Radicado", TxtRadicado.getText());
                JasperPrint imp = JasperFillManager.fillReport(des, parametro, ConeBD.BD); 
                JasperViewer jview = new JasperViewer(imp, false);
                //this.getContentPane().add(jview.getContentPane());
                jview.setModalExclusionType(FrmDRealizarJuego.ModalExclusionType.APPLICATION_EXCLUDE);//MUESTRA EL REPORTE EN FRENTE DEL JDIALOG
                jview.setVisible(true);
            }
            catch (Exception err)
            {
                JOptionPane.showMessageDialog(null, err);
                err.printStackTrace();
            }
    }
    
    private void jButton2ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButton2ActionPerformed
        
        int OpcG = JOptionPane.showConfirmDialog(null, "¿Confirmar el Juego de Lotto Animal ...?");
        if (OpcG == 0)
        {
            JOptionPane.showMessageDialog(null, "Juego Lotto Animal con Radicado : "+TxtRadicado.getText()+" Almacenado ...");
            Guardar(); 
        }
    }//GEN-LAST:event_jButton2ActionPerformed

    /**
     * @param args the command line arguments
     */
    
    public static void main(String args[]) {
        /*
         * Set the Nimbus look and feel
         */
        //<editor-fold defaultstate="collapsed" desc=" Look and feel setting code (optional) ">
        /*
         * If Nimbus (introduced in Java SE 6) is not available, stay with the
         * default look and feel. For details see
         * http://download.oracle.com/javase/tutorial/uiswing/lookandfeel/plaf.html
         */
        try {
            for (javax.swing.UIManager.LookAndFeelInfo info : javax.swing.UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    javax.swing.UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (ClassNotFoundException ex) {
            java.util.logging.Logger.getLogger(FrmDRealizarJuego.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(FrmDRealizarJuego.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(FrmDRealizarJuego.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(FrmDRealizarJuego.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /*
         * Create and display the dialog
         */
        java.awt.EventQueue.invokeLater(new Runnable() {

            public void run() {
                FrmDRealizarJuego dialog = new FrmDRealizarJuego(new javax.swing.JFrame(), true);
                dialog.addWindowListener(new java.awt.event.WindowAdapter() {

                    @Override
                    public void windowClosing(java.awt.event.WindowEvent e) {
                        System.exit(0);
                    }
                });
                dialog.setVisible(true);
            }
        });
    }
    // Variables declaration - do not modify//GEN-BEGIN:variables
    private com.toedter.calendar.JDateChooser FechaJuego;
    private javax.swing.JLabel JlHora;
    private javax.swing.JLabel JlSucursal;
    private javax.swing.JTable TablaHorario;
    private javax.swing.JTable TablaJugar;
    private javax.swing.JTable TablaRuleta;
    private javax.swing.JTextField TxtAnimal;
    private javax.swing.JTextField TxtCodA;
    private javax.swing.JTextField TxtCodigoA;
    private javax.swing.JTextField TxtCodigoH;
    private javax.swing.JTextField TxtHoraJuego;
    private javax.swing.JTextField TxtRadicado;
    private javax.swing.JTextField TxtTotalJ;
    private javax.swing.JTextField TxtValorJ;
    private javax.swing.JButton jButton1;
    private javax.swing.JButton jButton2;
    private javax.swing.JButton jButton3;
    private javax.swing.JButton jButton4;
    private javax.swing.JButton jButton5;
    private javax.swing.JButton jButton6;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel5;
    private javax.swing.JLabel jLabel6;
    private javax.swing.JPanel jPanel1;
    private javax.swing.JPanel jPanel2;
    private javax.swing.JPanel jPanel3;
    private javax.swing.JPanel jPanel4;
    private javax.swing.JPanel jPanel5;
    private javax.swing.JScrollPane jScrollPane1;
    private javax.swing.JScrollPane jScrollPane2;
    private javax.swing.JScrollPane jScrollPane3;
    // End of variables declaration//GEN-END:variables
}
