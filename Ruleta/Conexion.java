/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Ruleta;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.sql.*;
import javax.swing.JOptionPane;

/**
 *
 * @author OMGM
 */
public class Conexion {
    
    Connection BD;
    Statement StmBD;
    ResultSet RstBD;
    String Ruta = "";
    String MsgCone = "";
    /**
     * @param args the command line arguments
     */
    public void Coneccion_BD()
    {
        Archivo();
        try 
        {
            Class.forName("com.mysql.jdbc.Driver");
            BD = (Connection) DriverManager.getConnection("jdbc:mysql://"+Ruta+"","root","123"); //localhost/BD_pedidos
            //BD = (Connection) DriverManager.getConnection("jdbc:mysql://localhost:3306/BD_pedidos","root","123");
            StmBD = (Statement) BD.createStatement();
            //BD.close();
            //JOptionPane.showMessageDialog(null, "Conneción Exitosa...");
            MsgCone = "Conexion Exitosa BD lotto...";
        } 
        catch (SQLException e1) 
        {
            MsgCone = "Sin Conexión BD lotto...";
            JOptionPane.showMessageDialog(null,"No hay Conexión Con El Servidor -  BD"+e1);            
        }
        catch (Exception e2)
        {
            MsgCone = "Sin Conexión BD lotto...";
            JOptionPane.showMessageDialog(null,"No hay Conexión Con El Servidor -  BD"+e2);
        }
    }
    
    void Archivo()
    {
       String Text = "";       
        try
        {
            FileReader Ar = new FileReader("C://Rutalotto.dll");//Ruta del Archivo
            
            BufferedReader bf = new BufferedReader(Ar);
            while ((Text=bf.readLine()) != null)
            {
                Ruta = Text;
            }
            //System.out.println(Ruta);
            bf.close();
        }        
        catch(IOException ex)
        {
            ex.printStackTrace();
        }                  
    }
    
}